import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // -----------------------------------------
    // 1. Get raw Stripe webhook body
    // -----------------------------------------

    const body = await request.text();

    const headersList = await headers();

    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Stripe signature.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 2. Get webhook secret
    // -----------------------------------------

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          message: "Stripe webhook is not configured.",
        },
        { status: 500 },
      );
    }

    // -----------------------------------------
    // 3. Verify Stripe signature
    // -----------------------------------------

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error("STRIPE WEBHOOK SIGNATURE ERROR:", error.message);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid Stripe webhook signature.",
        },
        { status: 400 },
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    // -----------------------------------------
    // 4. Validate Stripe event ID
    // -----------------------------------------

    if (!event.id) {
      console.error("Stripe webhook event ID is missing.");

      return NextResponse.json(
        {
          success: false,
          message: "Stripe event ID is missing.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 5. Duplicate event protection
    // -----------------------------------------

    const existingEvent = await prisma.stripeWebhookEvent.findUnique({
      where: {
        eventId: event.id,
      },
    });

    if (existingEvent) {
      console.log(`Stripe webhook already processed: ${event.id}`);

      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    // -----------------------------------------
    // 6. PAYMENT SUCCESS
    // -----------------------------------------

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object;

      const { orderId, orderNumber, transactionId, userId } =
        checkoutSession.metadata || {};

      // -----------------------------------------
      // Validate order ID
      // -----------------------------------------

      if (!orderId) {
        console.error("Stripe webhook: orderId missing from metadata.");

        // Save event so Stripe doesn't repeatedly retry
        await prisma.stripeWebhookEvent.create({
          data: {
            eventId: event.id,
            eventType: event.type,
          },
        });

        return NextResponse.json({
          received: true,
        });
      }

      // -----------------------------------------
      // Find order
      // -----------------------------------------

      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
        },
        include: {
          payment: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        console.error(`Stripe webhook: Order not found: ${orderId}`);

        // Save event to prevent endless retries
        await prisma.stripeWebhookEvent.create({
          data: {
            eventId: event.id,
            eventType: event.type,
          },
        });

        return NextResponse.json({
          received: true,
        });
      }

      // -----------------------------------------
      // 7. Update Payment
      // -----------------------------------------

      await prisma.payment.updateMany({
        where: {
          orderId,
        },

        data: {
          status: "PAID",

          transactionId:
            transactionId || checkoutSession.payment_intent || null,

          paidAt: new Date(),
        },
      });

      // -----------------------------------------
      // 8. Update Order
      // -----------------------------------------

      await prisma.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "CONFIRMED",
        },
      });

      // -----------------------------------------
      // 9. Create payment notification
      // -----------------------------------------

      await createNotification({
        type: "PAYMENT",
        title: "Payment Successful",
        message: `Payment for order #${
          orderNumber || orderId
        } was successfully completed.`,
        link: `/admin/orders/${orderId}`,
        userId: null,
      });

      // -----------------------------------------
      // 10. Save processed Stripe event
      // -----------------------------------------

      await prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });

      console.log(`Payment successful for order: ${orderNumber || orderId}`);

      return NextResponse.json({
        received: true,
        success: true,
      });
    }

    // -----------------------------------------
    // 11. PAYMENT FAILED
    // -----------------------------------------

    if (event.type === "checkout.session.async_payment_failed") {
      const checkoutSession = event.data.object;

      const { orderId, orderNumber } = checkoutSession.metadata || {};

      if (orderId) {
        await prisma.payment.updateMany({
          where: {
            orderId,
          },

          data: {
            status: "FAILED",
          },
        });

        await createNotification({
          type: "PAYMENT",
          title: "Payment Failed",
          message: `Payment for order #${orderNumber || orderId} failed.`,
          link: `/admin/orders/${orderId}`,
          userId: null,
        });
      }

      // Save event
      await prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // 12. EXPIRED CHECKOUT
    // -----------------------------------------

    if (event.type === "checkout.session.expired") {
      const checkoutSession = event.data.object;

      const { orderId, orderNumber } = checkoutSession.metadata || {};

      if (orderId) {
        await prisma.payment.updateMany({
          where: {
            orderId,
          },

          data: {
            status: "FAILED",
          },
        });

        await createNotification({
          type: "PAYMENT",
          title: "Payment Session Expired",
          message: `Payment session for order #${
            orderNumber || orderId
          } has expired.`,
          link: `/admin/orders/${orderId}`,
          userId: null,
        });
      }

      // Save event
      await prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // 13. REFUND
    // -----------------------------------------

    if (event.type === "charge.refunded") {
      const charge = event.data.object;

      const paymentIntentId = charge.payment_intent;

      if (paymentIntentId) {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        const { orderId, orderNumber } = paymentIntent.metadata || {};

        if (orderId) {
          await prisma.payment.updateMany({
            where: {
              orderId,
            },

            data: {
              status: "REFUNDED",
            },
          });

          await createNotification({
            type: "PAYMENT",
            title: "Payment Refunded",
            message: `Payment for order #${
              orderNumber || orderId
            } has been refunded.`,
            link: `/admin/orders/${orderId}`,
            userId: null,
          });
        }
      }

      // Save event
      await prisma.stripeWebhookEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // 14. Save unhandled event
    // -----------------------------------------

    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    console.log(`Unhandled Stripe event saved: ${event.type}`);

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Stripe webhook processing failed.",
      },
      { status: 500 },
    );
  }
}

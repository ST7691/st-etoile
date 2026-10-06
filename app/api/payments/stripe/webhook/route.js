import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  try {
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

    // Verify that this request actually came from Stripe
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
    // PAYMENT SUCCESS
    // -----------------------------------------

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object;

      const { orderId, orderNumber, transactionId, userId } =
        checkoutSession.metadata || {};

      if (!orderId) {
        console.error("Stripe webhook: orderId missing from metadata.");

        return NextResponse.json({
          received: true,
        });
      }

      // -----------------------------------------
      // Update Payment
      // -----------------------------------------

      await prisma.payment.updateMany({
        where: {
          orderId,
        },

        data: {
          status: "PAID",

          transactionId:
            transactionId || checkoutSession.payment_intent || null,
        },
      });

      // -----------------------------------------
      // Update Order
      // -----------------------------------------

      await prisma.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: "CONFIRMED",
        },
      });

      console.log(`Payment successful for order: ${orderNumber || orderId}`);

      return NextResponse.json({
        received: true,
        success: true,
      });
    }

    // -----------------------------------------
    // PAYMENT FAILED
    // -----------------------------------------

    if (event.type === "checkout.session.async_payment_failed") {
      const checkoutSession = event.data.object;

      const { orderId } = checkoutSession.metadata || {};

      if (orderId) {
        await prisma.payment.updateMany({
          where: {
            orderId,
          },

          data: {
            status: "FAILED",
          },
        });
      }

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // EXPIRED CHECKOUT
    // -----------------------------------------

    if (event.type === "checkout.session.expired") {
      const checkoutSession = event.data.object;

      const { orderId } = checkoutSession.metadata || {};

      if (orderId) {
        await prisma.payment.updateMany({
          where: {
            orderId,
          },

          data: {
            status: "FAILED",
          },
        });
      }

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // REFUND
    // -----------------------------------------

    if (event.type === "charge.refunded") {
      const charge = event.data.object;

      const paymentIntentId = charge.payment_intent;

      if (paymentIntentId) {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        const { orderId } = paymentIntent.metadata || {};

        if (orderId) {
          await prisma.payment.updateMany({
            where: {
              orderId,
            },

            data: {
              status: "REFUNDED",
            },
          });
        }
      }

      return NextResponse.json({
        received: true,
      });
    }

    // -----------------------------------------
    // Unknown / unhandled event
    // -----------------------------------------

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

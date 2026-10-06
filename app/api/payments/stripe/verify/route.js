import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    // -----------------------------------------
    // 1. Check authentication
    // -----------------------------------------
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 2. Get Stripe session ID
    // -----------------------------------------
    const { searchParams } = new URL(request.url);

    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe session ID is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 3. Retrieve Stripe Checkout Session
    // -----------------------------------------
    const checkoutSession =
      await stripe.checkout.sessions.retrieve(
        sessionId
      );

    // -----------------------------------------
    // 4. Verify Stripe session belongs to user
    // -----------------------------------------
    const metadata =
      checkoutSession.metadata || {};

    const orderId = metadata.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order information was not found in Stripe session.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. Find user's order
    // -----------------------------------------
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },

      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 6. Check Stripe payment status
    // -----------------------------------------
    const stripePaymentStatus =
      checkoutSession.payment_status;

    // -----------------------------------------
    // 7. If Stripe says paid, sync database
    // -----------------------------------------
    if (stripePaymentStatus === "paid") {
      await prisma.payment.updateMany({
        where: {
          orderId: order.id,
        },

        data: {
          status: "PAID",

          transactionId:
            metadata.transactionId ||
            checkoutSession.payment_intent ||
            order.payment?.transactionId ||
            null,
        },
      });

      // Don't overwrite a cancelled order
      if (order.status !== "CANCELLED") {
        await prisma.order.update({
          where: {
            id: order.id,
          },

          data: {
            status: "CONFIRMED",
          },
        });
      }
    }

    // -----------------------------------------
    // 8. Payment failed
    // -----------------------------------------
    if (
      stripePaymentStatus === "unpaid" &&
      checkoutSession.status === "expired"
    ) {
      await prisma.payment.updateMany({
        where: {
          orderId: order.id,
        },

        data: {
          status: "FAILED",
        },
      });
    }

    // -----------------------------------------
    // 9. Return payment information
    // -----------------------------------------
    const updatedPayment =
      await prisma.payment.findUnique({
        where: {
          orderId: order.id,
        },
      });

    return NextResponse.json({
      success: true,

      data: {
        orderId: order.id,

        orderNumber: order.orderNumber,

        amount:
          updatedPayment?.amount ??
          order.total,

        currency:
          checkoutSession.currency?.toUpperCase() ||
          "USD",

        paymentStatus:
          updatedPayment?.status ||
          "PENDING",

        stripePaymentStatus,

        transactionId:
          updatedPayment?.transactionId ||
          metadata.transactionId ||
          checkoutSession.payment_intent ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "STRIPE VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Unable to verify Stripe payment.",
      },
      { status: 500 }
    );
  }
}
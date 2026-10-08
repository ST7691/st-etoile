import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe session ID is required.",
        },
        { status: 400 },
      );
    }

    // 1. Retrieve Checkout Session directly from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe checkout session was not found.",
        },
        { status: 404 },
      );
    }

    // 2. Get metadata from Stripe
    const metadata = checkoutSession.metadata || {};

    const orderId = metadata.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID was not found in Stripe session.",
        },
        { status: 400 },
      );
    }

    // 3. Find order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
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
        { status: 404 },
      );
    }

    const stripePaymentStatus = checkoutSession.payment_status;
    const stripeSessionStatus = checkoutSession.status;

    // 4. Payment successful
    if (stripePaymentStatus === "paid") {
      if (!order.payment) {
        return NextResponse.json(
          {
            success: false,
            message: "Payment record was not found for this order.",
          },
          { status: 404 },
        );
      }

      await prisma.payment.update({
        where: {
          orderId: order.id,
        },
        data: {
          status: "PAID",

          transactionId:
            checkoutSession.payment_intent ||
            order.payment.transactionId ||
            null,

          paidAt: order.payment.paidAt || new Date(),
        },
      });

      // Confirm order after successful payment
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

    // 5. Expired unpaid checkout
    if (stripePaymentStatus === "unpaid" && stripeSessionStatus === "expired") {
      if (order.payment) {
        await prisma.payment.update({
          where: {
            orderId: order.id,
          },
          data: {
            status: "FAILED",
          },
        });
      }
    }

    // 6. Get latest payment
    const updatedPayment = await prisma.payment.findUnique({
      where: {
        orderId: order.id,
      },
    });

    return NextResponse.json({
      success: true,

      data: {
        orderId: order.id,

        orderNumber: order.orderNumber,

        amount: updatedPayment?.amount ?? order.total,

        currency: checkoutSession.currency?.toUpperCase() || "USD",

        paymentStatus: updatedPayment?.status || "PENDING",

        stripePaymentStatus,

        stripeSessionStatus,

        transactionId:
          updatedPayment?.transactionId ||
          checkoutSession.payment_intent ||
          null,
      },
    });
  } catch (error) {
    console.error("STRIPE VERIFY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to verify Stripe payment.",
      },
      { status: 500 },
    );
  }
}

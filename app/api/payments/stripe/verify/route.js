import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

    // Get Stripe Checkout Session
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

    // Get order ID from Stripe metadata
    const orderId = checkoutSession.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order information was not found in Stripe session.",
        },
        { status: 400 },
      );
    }

    // Try to get current logged-in user
    let session = null;

    try {
      session = await auth();
    } catch (authError) {
      console.error("STRIPE VERIFY AUTH WARNING:", authError);
    }

    const userId = session?.user?.id || null;

    // Find order
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

    /*
      IMPORTANT:

      On Stripe production callback, Auth session can sometimes
      be unavailable or have a different user ID.

      Stripe session_id is already being verified directly with Stripe,
      and the orderId comes from Stripe metadata.

      Therefore:
      - If a logged-in user exists, verify ownership.
      - If no session is available, continue with Stripe verification.
    */

    if (userId && order.userId !== userId) {
      console.warn("STRIPE VERIFY USER MISMATCH:", {
        orderId: order.id,
        orderUserId: order.userId,
        sessionUserId: userId,
      });

      return NextResponse.json(
        {
          success: false,
          message: "This Stripe payment belongs to a different account.",
        },
        { status: 403 },
      );
    }

    const stripePaymentStatus = checkoutSession.payment_status;
    const stripeSessionStatus = checkoutSession.status;

    /*
      PAYMENT SUCCESS
    */
    if (stripePaymentStatus === "paid") {
      await prisma.payment.updateMany({
        where: {
          orderId: order.id,
        },
        data: {
          status: "PAID",

          transactionId:
            checkoutSession.payment_intent ||
            order.payment?.transactionId ||
            null,

          paidAt: order.payment?.paidAt || new Date(),
        },
      });

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

    /*
      PAYMENT EXPIRED / FAILED
    */
    if (stripePaymentStatus === "unpaid" && stripeSessionStatus === "expired") {
      await prisma.payment.updateMany({
        where: {
          orderId: order.id,
        },
        data: {
          status: "FAILED",
        },
      });
    }

    // Get latest payment state
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

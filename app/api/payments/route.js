import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_METHODS = ["COD", "SSLCOMMERZ", "STRIPE"];

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const orderId = String(body.orderId || "").trim();
    const method = String(body.method || "")
      .trim()
      .toUpperCase();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_METHODS.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        { status: 400 },
      );
    }

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
        { status: 404 },
      );
    }

    /* Prevent payment for cancelled orders */

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled orders cannot be paid.",
        },
        { status: 400 },
      );
    }

    /* =====================================================
       COD
    ===================================================== */

    if (method === "COD") {
      const payment = order.payment
        ? await prisma.payment.update({
            where: {
              orderId: order.id,
            },
            data: {
              method: "COD",
              status: "PENDING",
              amount: order.total,
            },
          })
        : await prisma.payment.create({
            data: {
              orderId: order.id,
              method: "COD",
              status: "PENDING",
              amount: order.total,
            },
          });

      return NextResponse.json({
        success: true,
        message: "Cash on delivery selected.",
        data: {
          payment,
          paymentRequired: false,
          redirectUrl: `/orders/${order.id}`,
        },
      });
    }

    /* =====================================================
       ONLINE PAYMENT
    ===================================================== */

    if (method === "SSLCOMMERZ") {
      return NextResponse.json({
        success: false,
        message: "SSLCommerz payment gateway is not connected yet.",
        paymentRequired: true,
        method: "SSLCOMMERZ",
      });
    }

    if (method === "STRIPE") {
      return NextResponse.json({
        success: false,
        message: "Stripe payment gateway is not connected yet.",
        paymentRequired: true,
        method: "STRIPE",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unsupported payment method.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("PAYMENT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment processing failed.",
      },
      { status: 500 },
    );
  }
}

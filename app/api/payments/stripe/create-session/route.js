import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request) {
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
        { status: 401 },
      );
    }

    // -----------------------------------------
    // 2. Read request body
    // -----------------------------------------
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 3. Find user's order
    // -----------------------------------------
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        user: true,
        deliveryAddress: true,
        payment: true,
        items: {
          include: {
            menuItem: true,
          },
        },
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

    // -----------------------------------------
    // 4. Validate order
    // -----------------------------------------
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancelled orders cannot be paid.",
        },
        { status: 400 },
      );
    }

    if (order.payment?.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid.",
        },
        { status: 400 },
      );
    }

    if (order.paymentMethod !== "STRIPE") {
      return NextResponse.json(
        {
          success: false,
          message: "This order is not configured for Stripe payment.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 5. App URL
    // -----------------------------------------
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // -----------------------------------------
    // 6. Create Stripe line items
    // -----------------------------------------
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "usd",

        product_data: {
          name: item.menuItem.name,

          description:
            item.menuItem.description?.slice(0, 200) ||
            "ST Restaurant menu item",

          ...(item.menuItem.image
            ? {
                images: [item.menuItem.image],
              }
            : {}),
        },

        unit_amount: Math.round(Number(item.price) * 100),
      },

      quantity: item.quantity,
    }));

    // -----------------------------------------
    // 7. Delivery fee
    // -----------------------------------------
    const deliveryFee = Number(order.deliveryFee || 0);

    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Delivery Fee",
            description: "ST Restaurant home delivery",
          },

          unit_amount: Math.round(deliveryFee * 100),
        },

        quantity: 1,
      });
    }

    // -----------------------------------------
    // 8. Discount
    // -----------------------------------------
    //
    // IMPORTANT:
    // Do NOT add negative Stripe line items.
    //
    // We will handle discounts using Stripe coupons
    // if your current Prisma order contains discount.
    //

    const discount = Number(order.discount || 0);

    let discounts = undefined;

    if (discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: "usd",
        duration: "once",
        name: `ST Restaurant Discount - ${order.orderNumber}`,
      });

      discounts = [
        {
          coupon: coupon.id,
        },
      ];
    }

    // -----------------------------------------
    // 9. Transaction ID
    // -----------------------------------------
    const transactionId = `ST-${order.orderNumber}-${Date.now()}`;

    // -----------------------------------------
    // 10. Create Stripe Checkout Session
    // -----------------------------------------
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: order.user?.email || session.user.email,

      line_items: lineItems,

      ...(discounts ? { discounts } : {}),

      metadata: {
        orderId: order.id,
        userId: session.user.id,
        orderNumber: order.orderNumber,
        transactionId,
      },

      success_url:
        `${appUrl}/payment/stripe-success` +
        `?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${appUrl}/orders/${order.id}`,

      billing_address_collection: "auto",

      phone_number_collection: {
        enabled: true,
      },

      submit_type: "pay",

      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: session.user.id,
        },
      },
    });

    // -----------------------------------------
    // 11. Create / update Payment
    // -----------------------------------------
    await prisma.payment.upsert({
      where: {
        orderId: order.id,
      },

      update: {
        method: "STRIPE",
        status: "PENDING",
        transactionId,
        amount: order.total,
      },

      create: {
        orderId: order.id,
        method: "STRIPE",
        status: "PENDING",
        transactionId,
        amount: order.total,
      },
    });

    // -----------------------------------------
    // 12. Return checkout URL
    // -----------------------------------------
    return NextResponse.json({
      success: true,

      data: {
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
    });
  } catch (error) {
    console.error("STRIPE CREATE SESSION ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        message: error?.message || "Unable to create Stripe checkout session.",
      },
      { status: 500 },
    );
  }
}

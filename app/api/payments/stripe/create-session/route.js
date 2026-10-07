import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Check whether a value is a valid HTTP/HTTPS URL.
 */
function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Get and validate application URL.
 */
function getAppUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!isValidHttpUrl(rawUrl)) {
    throw new Error(
      "Invalid NEXT_PUBLIC_APP_URL. Use http://localhost:3000 for local development.",
    );
  }

  return new URL(rawUrl).origin;
}

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
    // 5. Validate order items
    // -----------------------------------------
    if (!order.items?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has no items.",
        },
        { status: 400 },
      );
    }

    // -----------------------------------------
    // 6. App URL
    // -----------------------------------------
    const appUrl = getAppUrl();

    const successUrl =
      `${appUrl}/payment/stripe-success` + `?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = `${appUrl}/orders/${order.id}`;

    // -----------------------------------------
    // 7. Create Stripe line items
    // -----------------------------------------
    //
    // IMPORTANT:
    // Do NOT send menuItem.image directly.
    //
    // Some database images may be:
    // /uploads/image.jpg
    // image.jpg
    // empty strings
    // invalid URLs
    //
    // Stripe requires absolute HTTP/HTTPS URLs.
    //
    // Therefore product images are intentionally
    // omitted from Stripe Checkout.
    //

    const lineItems = order.items.map((item) => {
      const unitAmount = Math.round(Number(item.price) * 100);

      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        throw new Error(`Invalid price for menu item: ${item.menuItem.name}`);
      }

      return {
        price_data: {
          currency: "usd",

          product_data: {
            name: item.menuItem.name,

            description:
              item.menuItem.description?.slice(0, 200) ||
              "ST Restaurant menu item",
          },

          unit_amount: unitAmount,
        },

        quantity: item.quantity,
      };
    });

    // -----------------------------------------
    // 8. Delivery fee
    // -----------------------------------------
    const deliveryFee = Number(order.deliveryFee || 0);

    if (deliveryFee > 0) {
      const deliveryAmount = Math.round(deliveryFee * 100);

      if (!Number.isFinite(deliveryAmount)) {
        throw new Error("Invalid delivery fee.");
      }

      lineItems.push({
        price_data: {
          currency: "usd",

          product_data: {
            name: "Delivery Fee",
            description: "ST Restaurant home delivery",
          },

          unit_amount: deliveryAmount,
        },

        quantity: 1,
      });
    }

    // -----------------------------------------
    // 9. Discount
    // -----------------------------------------
    const discount = Number(order.discount || 0);

    let discounts;

    if (discount > 0) {
      const discountAmount = Math.round(discount * 100);

      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        throw new Error("Invalid discount amount.");
      }

      const coupon = await stripe.coupons.create({
        amount_off: discountAmount,
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
    // 10. Transaction ID
    // -----------------------------------------
    const transactionId = `ST-${order.orderNumber}-${Date.now()}`;

    // -----------------------------------------
    // 11. Create Stripe Checkout Session
    // -----------------------------------------
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: order.user?.email || session.user.email || undefined,

      line_items: lineItems,

      ...(discounts ? { discounts } : {}),

      metadata: {
        orderId: order.id,
        userId: session.user.id,
        orderNumber: order.orderNumber,
        transactionId,
      },

      success_url: successUrl,

      cancel_url: cancelUrl,

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
    // 12. Verify Stripe checkout URL
    // -----------------------------------------
    if (!checkoutSession.url || !isValidHttpUrl(checkoutSession.url)) {
      throw new Error("Stripe did not return a valid checkout URL.");
    }

    // -----------------------------------------
    // 13. Create / update Payment
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
    // 14. Return checkout URL
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

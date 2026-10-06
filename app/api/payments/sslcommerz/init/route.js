import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sslcommerzConfig, sslcommerzBaseUrl } from "@/lib/sslcommerz";

export const runtime = "nodejs";

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

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    if (!sslcommerzConfig.store_id || !sslcommerzConfig.store_passwd) {
      return NextResponse.json(
        {
          success: false,
          message: "SSLCommerz configuration is missing.",
        },
        { status: 500 },
      );
    }

    /* =====================================================
       FIND ORDER
    ===================================================== */

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        payment: true,
        deliveryAddress: true,
        user: true,
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
       PAYMENT
    ===================================================== */

    const payment =
      order.payment ||
      (await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "SSLCOMMERZ",
          status: "PENDING",
          amount: order.total,
        },
      }));

    if (payment.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid.",
        },
        { status: 400 },
      );
    }

    await prisma.payment.update({
      where: {
        orderId: order.id,
      },
      data: {
        method: "SSLCOMMERZ",
        status: "PENDING",
        amount: order.total,
      },
    });

    /* =====================================================
       APP URL
    ===================================================== */

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    /* =====================================================
       SSLCommerz DATA
    ===================================================== */

    const transactionId = `ST-${order.orderNumber}-${Date.now()}`;

    const paymentData = {
      store_id: sslcommerzConfig.store_id,
      store_passwd: sslcommerzConfig.store_passwd,
      total_amount: Number(order.total).toFixed(2),
      currency: "BDT",

      tran_id: transactionId,

      success_url: `${appUrl}/api/payments/sslcommerz/success`,
      fail_url: `${appUrl}/api/payments/sslcommerz/fail`,
      cancel_url: `${appUrl}/api/payments/sslcommerz/cancel`,
      ipn_url: `${appUrl}/api/payments/sslcommerz/ipn`,

      product_name: `ST Restaurant Order ${order.orderNumber}`,
      product_category: "Food",
      product_profile: "general",

      cus_name:
        order.deliveryAddress?.fullName || order.user?.name || "ST Customer",

      cus_email: order.user?.email || "customer@example.com",

      cus_add1: order.deliveryAddress?.address || "Dhaka",

      cus_city: order.deliveryAddress?.city || "Dhaka",

      cus_state: order.deliveryAddress?.area || "Dhaka",

      cus_postcode: order.deliveryAddress?.postalCode || "1200",

      cus_country: "Bangladesh",

      cus_phone:
        order.deliveryAddress?.phone || order.user?.phone || "01700000000",

      shipping_method: "Courier",

      ship_name:
        order.deliveryAddress?.fullName || order.user?.name || "ST Customer",

      ship_add1: order.deliveryAddress?.address || "Dhaka",

      ship_city: order.deliveryAddress?.city || "Dhaka",

      ship_state: order.deliveryAddress?.area || "Dhaka",

      ship_postcode: order.deliveryAddress?.postalCode || "1200",

      ship_country: "Bangladesh",

      value_a: order.id,
      value_b: session.user.id,
    };

    /* =====================================================
       REQUEST SSLCommerz
    ===================================================== */

    const formBody = new URLSearchParams();

    Object.entries(paymentData).forEach(([key, value]) => {
      formBody.append(key, String(value ?? ""));
    });

    const response = await fetch(`${sslcommerzBaseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!result?.GatewayPageURL && !result?.redirectGatewayURL) {
      console.error("SSLCOMMERZ INIT RESPONSE:", result);

      return NextResponse.json(
        {
          success: false,
          message:
            result?.failedreason || "SSLCommerz payment initialization failed.",
        },
        { status: 502 },
      );
    }

    const gatewayUrl = result.GatewayPageURL || result.redirectGatewayURL;

    /* =====================================================
       SAVE TRANSACTION ID
    ===================================================== */

    await prisma.payment.update({
      where: {
        orderId: order.id,
      },
      data: {
        method: "SSLCOMMERZ",
        status: "PENDING",
        transactionId,
        amount: order.total,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment initialized successfully.",
      data: {
        gatewayUrl,
        transactionId,
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("SSLCOMMERZ INIT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to initialize payment.",
      },
      { status: 500 },
    );
  }
}

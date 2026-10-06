import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sslcommerzBaseUrl, sslcommerzConfig } from "@/lib/sslcommerz";

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
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    if (
      !process.env.SSLCOMMERZ_STORE_ID ||
      !process.env.SSLCOMMERZ_STORE_PASSWORD
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "SSLCommerz configuration is missing.",
        },
        { status: 500 },
      );
    }

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

    if (order.payment?.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid.",
        },
        { status: 400 },
      );
    }

    const transactionId = `ST-${order.orderNumber}-${Date.now()}`;

    await prisma.payment.upsert({
      where: {
        orderId: order.id,
      },
      update: {
        method: "SSLCOMMERZ",
        status: "PENDING",
        transactionId,
        amount: order.total,
        paidAt: null,
      },
      create: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "PENDING",
        transactionId,
        amount: order.total,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const params = new URLSearchParams();

    params.set("store_id", sslcommerzConfig.store_id);
    params.set("store_passwd", sslcommerzConfig.store_passwd);
    params.set("total_amount", String(order.total));
    params.set("currency", "BDT");
    params.set("tran_id", transactionId);

    params.set("success_url", `${appUrl}/api/payments/sslcommerz/success`);

    params.set("fail_url", `${appUrl}/api/payments/sslcommerz/fail`);

    params.set("cancel_url", `${appUrl}/api/payments/sslcommerz/cancel`);

    params.set("ipn_url", `${appUrl}/api/payments/sslcommerz/ipn`);

    params.set(
      "cus_name",
      order.deliveryAddress?.fullName || order.user.name || "ST Customer",
    );
    params.set("cus_email", order.user.email || "");
    params.set(
      "cus_phone",
      order.deliveryAddress?.phone || order.user.phone || "",
    );

    params.set("cus_add1", order.deliveryAddress?.address || "N/A");

    params.set("cus_city", order.deliveryAddress?.city || "Dhaka");

    params.set("shipping_method", "YES");
    params.set("ship_name", order.deliveryAddress?.fullName || "Customer");
    params.set("ship_add1", order.deliveryAddress?.address || "N/A");
    params.set("ship_city", order.deliveryAddress?.city || "Dhaka");

    params.set("product_name", `ST Restaurant Order ${order.orderNumber}`);
    params.set("product_category", "Food");
    params.set("product_profile", "general");

    // Server-side mapping
    params.set("value_a", order.id);
    params.set("value_b", session.user.id);

    const response = await fetch(`${sslcommerzBaseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result?.GatewayPageURL) {
      console.error("SSL RETRY RESPONSE:", result);

      return NextResponse.json(
        {
          success: false,
          message:
            result?.failedreason || "Unable to start SSLCommerz payment.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gatewayUrl: result.GatewayPageURL,
        transactionId,
      },
    });
  } catch (error) {
    console.error("SSL RETRY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to retry payment.",
      },
      { status: 500 },
    );
  }
}

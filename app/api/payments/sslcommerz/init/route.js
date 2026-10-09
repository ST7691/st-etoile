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
    const orderId = String(body?.orderId || "").trim();

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

    const address = order.deliveryAddress;
    const user = order.user;

    const customerName =
      address?.fullName?.trim() || user?.name?.trim() || "ST Customer";

    const customerEmail = user?.email?.trim() || "customer@example.com";

    const customerPhone =
      address?.phone?.trim() || user?.phone?.trim() || "01700000000";

    const customerAddress = address?.address?.trim() || "Dhaka";

    const customerCity = address?.city?.trim() || "Dhaka";

    const customerState = address?.area?.trim() || customerCity;

    // SSLCommerz requires a non-empty postcode.
    // Prefer the actual postcode saved with the delivery address.
    const postalCode = String(address?.postalCode ?? "").trim() || "1200";

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

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

      // Customer information
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: customerAddress,
      cus_city: customerCity,
      cus_state: customerState,
      cus_postcode: postalCode,
      cus_country: "Bangladesh",
      cus_phone: customerPhone,

      // Shipping information
      shipping_method: "Courier",
      ship_name: customerName,
      ship_add1: customerAddress,
      ship_city: customerCity,
      ship_state: customerState,
      ship_postcode: postalCode,
      ship_country: "Bangladesh",

      // Internal references
      value_a: order.id,
      value_b: session.user.id,
    };

    const formBody = new URLSearchParams();

    for (const [key, value] of Object.entries(paymentData)) {
      formBody.set(key, String(value ?? ""));
    }

    // Final validation before contacting the gateway.
    const requiredFields = [
      "ship_name",
      "ship_add1",
      "ship_city",
      "ship_postcode",
      "ship_country",
      "cus_name",
      "cus_email",
      "cus_phone",
      "cus_postcode",
    ];

    const missingFields = requiredFields.filter(
      (field) => !String(paymentData[field] ?? "").trim(),
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required payment information: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const response = await fetch(`${sslcommerzBaseUrl}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error("SSLCommerz HTTP status:", response.status);

      return NextResponse.json(
        {
          success: false,
          message: "SSLCommerz gateway request failed.",
        },
        { status: 502 },
      );
    }

    const result = await response.json();

    console.log("SSLCommerz initialization status:", result?.status);

    if (result?.status !== "SUCCESS") {
      console.error(
        "SSLCommerz initialization rejected:",
        result?.failedreason || "No gateway URL returned.",
      );

      return NextResponse.json(
        {
          success: false,
          message:
            result?.failedreason || "SSLCommerz payment initialization failed.",
        },
        { status: 502 },
      );
    }

    const gatewayUrl = result?.GatewayPageURL || result?.redirectGatewayURL;

    if (!gatewayUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment gateway URL was not returned.",
        },
        { status: 502 },
      );
    }

    let parsedGatewayUrl;

    try {
      parsedGatewayUrl = new URL(gatewayUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment gateway URL.",
        },
        { status: 502 },
      );
    }

    const allowedHosts = new Set([
      "sandbox.sslcommerz.com",
      "securepay.sslcommerz.com",
    ]);

    if (
      parsedGatewayUrl.protocol !== "https:" ||
      !allowedHosts.has(parsedGatewayUrl.hostname)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment gateway URL.",
        },
        { status: 502 },
      );
    }

    // Save the pending payment before redirecting the customer.
    await prisma.$transaction(async (tx) => {
      if (order.payment) {
        await tx.payment.update({
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
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: "SSLCOMMERZ",
            status: "PENDING",
            transactionId,
            amount: order.total,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Payment initialized successfully.",
      data: {
        gatewayUrl: parsedGatewayUrl.toString(),
        transactionId,
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error(
      "SSLCommerz initialization error:",
      error?.name || "Error",
      error?.message || "Unknown error",
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.name === "TimeoutError" || error?.name === "AbortError"
            ? "Payment gateway timed out. Please try again."
            : "Unable to initialize payment.",
      },
      { status: 500 },
    );
  }
}

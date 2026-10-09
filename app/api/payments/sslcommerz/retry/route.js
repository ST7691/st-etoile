import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (value, fallback = "") => {
  const result = String(value ?? "").trim();
  return result || fallback;
};

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const orderId = clean(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 },
      );
    }

    const storeId = clean(process.env.SSLCOMMERZ_STORE_ID);
    const storePassword = clean(process.env.SSLCOMMERZ_STORE_PASSWORD);
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

    console.log("SSLCommerz config:", {
      storeIdPresent: Boolean(storeId),
      passwordPresent: Boolean(storePassword),
      liveMode: isLive,
    });

    if (!storeId || !storePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "SSLCommerz credentials are missing in .env.local.",
        },
        { status: 500 },
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: true,
        deliveryAddress: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 },
      );
    }

    if (["CANCELLED", "CANCELED"].includes(clean(order.status).toUpperCase())) {
      return NextResponse.json(
        { success: false, message: "This order is cancelled." },
        { status: 400 },
      );
    }

    const amount = Number(order.totalAmount ?? order.total ?? order.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order amount." },
        { status: 400 },
      );
    }

    const currency = clean(order.currency, "BDT").toUpperCase();

    if (currency !== "BDT") {
      return NextResponse.json(
        { success: false, message: "Order currency must be BDT." },
        { status: 400 },
      );
    }

    const address = order.deliveryAddress ?? {};
    const customerName = clean(order.user?.name, "Restaurant Customer");
    const customerEmail = clean(order.user?.email, "customer@example.com");
    const customerPhone = clean(
      address.phone,
      clean(order.user?.phone, "01700000000"),
    );
    const customerAddress = clean(
      address.addressLine1,
      clean(address.address, "Dhaka"),
    );
    const city = clean(address.city, "Dhaka");
    const state = clean(address.state, city);
    const postcode = clean(address.postalCode, "1200");
    const country = clean(address.country, "Bangladesh");

    const appUrl = clean(
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3000",
    ).replace(/\/+$/, "");

    const gatewayBase = isLive
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox-gw.sslcommerz.com";

    const tranId = `ST-${order.id}-${Date.now()}`.slice(0, 60);

    const form = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: amount.toFixed(2),
      currency: "BDT",
      tran_id: tranId,

      success_url: `${appUrl}/api/payments/sslcommerz/success`,
      fail_url: `${appUrl}/api/payments/sslcommerz/fail`,
      cancel_url: `${appUrl}/api/payments/sslcommerz/cancel`,
      ipn_url: `${appUrl}/api/payments/sslcommerz/ipn`,

      product_name: `ST Restaurant Order ${order.id}`,
      product_category: "Restaurant",
      product_profile: "general",

      cus_name: customerName,
      cus_email: customerEmail,
      cus_phone: customerPhone,
      cus_add1: customerAddress,
      cus_add2: city,
      cus_city: city,
      cus_state: state,
      cus_postcode: postcode,
      cus_country: country,

      shipping_method: "YES",
      num_of_item: String(Math.max(order.items?.length ?? 1, 1)),
      ship_name: customerName,
      ship_add1: customerAddress,
      ship_add2: city,
      ship_city: city,
      ship_state: state,
      ship_postcode: postcode,
      ship_country: country,
    });

    console.log("SSLCommerz request:", {
      endpoint: `${gatewayBase}/gwprocess/v4/api.php`,
      orderId: order.id,
      amount: amount.toFixed(2),
      postcodePresent: Boolean(form.get("ship_postcode")),
    });

    const gatewayResponse = await fetch(`${gatewayBase}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
      cache: "no-store",
    });

    const raw = await gatewayResponse.text();
    let result;

    try {
      result = JSON.parse(raw);
    } catch {
      console.error("SSLCommerz non-JSON response:", {
        httpStatus: gatewayResponse.status,
        responsePreview: raw.slice(0, 300),
      });

      return NextResponse.json(
        {
          success: false,
          message: "SSLCommerz returned an invalid response.",
        },
        { status: 502 },
      );
    }

    const gatewayUrl = clean(result?.GatewayPageURL);

    if (
      !gatewayResponse.ok ||
      result?.status !== "SUCCESS" ||
      !gatewayUrl.startsWith("https://")
    ) {
      console.error("SSLCommerz rejected payment:", {
        httpStatus: gatewayResponse.status,
        status: result?.status,
        failedreason: result?.failedreason,
        storeName: result?.store_name,
        sessionkeyPresent: Boolean(result?.sessionkey),
      });

      return NextResponse.json(
        {
          success: false,
          message:
            clean(result?.failedreason) ||
            "SSLCommerz payment initialization failed.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment session created.",
      data: {
        gatewayUrl,
        transactionId: tranId,
      },
    });
  } catch (error) {
    console.error("SSLCommerz route error:", {
      name: error?.name,
      message: error?.message,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Unable to initialize payment. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
console.log("SSLCommerz safe diagnostic:", {
  storeIdPresent: Boolean(process.env.SSLCOMMERZ_STORE_ID),
  storeIdMatches: process.env.SSLCOMMERZ_STORE_ID === "steto6ac8f9550d180",
  passwordPresent: Boolean(process.env.SSLCOMMERZ_STORE_PASSWORD),
  isLive: process.env.SSLCOMMERZ_IS_LIVE === "true",
});
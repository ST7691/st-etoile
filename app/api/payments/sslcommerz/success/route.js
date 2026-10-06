import { NextResponse } from "next/server";
import { verifySSLCommerzPayment } from "@/lib/verifySSLCommerzPayment";

export const runtime = "nodejs";

export async function POST(request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const formData = await request.formData();

    const valId = String(formData.get("val_id") || "").trim();

    const tranId = String(formData.get("tran_id") || "").trim();

    const orderId = String(formData.get("value_a") || "").trim();

    if (!orderId) {
      return NextResponse.redirect(new URL("/payment/failed", appUrl));
    }

    const result = await verifySSLCommerzPayment({
      valId,
      tranId,
      orderId,
    });

    if (!result.success) {
      throw new Error("Payment verification failed.");
    }

    return NextResponse.redirect(
      new URL(`/payment/success?orderId=${orderId}`, appUrl),
    );
  } catch (error) {
    console.error("SSLCOMMERZ SUCCESS ERROR:", error);

    return NextResponse.redirect(new URL("/payment/failed", appUrl));
  }
}

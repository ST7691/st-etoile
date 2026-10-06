import { NextResponse } from "next/server";
import { verifySSLCommerzPayment } from "@/lib/verifySSLCommerzPayment";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const valId = String(formData.get("val_id") || "").trim();

    const tranId = String(formData.get("tran_id") || "").trim();

    const orderId = String(formData.get("value_a") || "").trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID missing.",
        },
        { status: 400 },
      );
    }

    await verifySSLCommerzPayment({
      valId,
      tranId,
      orderId,
    });

    return NextResponse.json({
      success: true,
      message: "IPN processed successfully.",
    });
  } catch (error) {
    console.error("SSLCOMMERZ IPN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "IPN processing failed.",
      },
      { status: 400 },
    );
  }
}

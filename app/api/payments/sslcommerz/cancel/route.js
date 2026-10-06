import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const formData = await request.formData();

    const orderId = String(formData.get("value_a") || "").trim();

    if (orderId) {
      await prisma.payment.updateMany({
        where: {
          orderId,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });
    }

    return NextResponse.redirect(
      new URL(
        `/payment/cancelled${orderId ? `?orderId=${orderId}` : ""}`,
        appUrl,
      ),
    );
  } catch (error) {
    console.error("SSLCOMMERZ CANCEL ERROR:", error);

    return NextResponse.redirect(new URL("/payment/cancelled", appUrl));
  }
}

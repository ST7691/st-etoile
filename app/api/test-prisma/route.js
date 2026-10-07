import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,

      hasNotificationModel: typeof prisma.notification !== "undefined",

      models: Object.keys(prisma).filter(
        (key) => !key.startsWith("_") && !key.startsWith("$"),
      ),
    });
  } catch (error) {
    console.error("PRISMA TEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

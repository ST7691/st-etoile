import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "STAFF"];

const ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const status = String(body.status || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 },
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id,
      },

      data: {
        status,
      },

      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order status changed to ${status}.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status.",
      },
      { status: 500 },
    );
  }
}

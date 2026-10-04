import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "STAFF"];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        deliveryFee: true,
        discount: true,
        total: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },

        deliveryAddress: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            area: true,
          },
        },

        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },

        payment: {
          select: {
            status: true,
            method: true,
            amount: true,
            transactionId: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("ADMIN ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load orders.",
      },
      { status: 500 },
    );
  }
}

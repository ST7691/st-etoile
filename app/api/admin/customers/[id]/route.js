import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isStaff(role) {
  return role === "ADMIN" || role === "STAFF";
}

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user || !isStaff(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    const customer = await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,

        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 10,
        },

        reservations: {
          select: {
            id: true,
            name: true,
            phone: true,
            date: true,
            guests: true,
            time: true,
            status: true,
          },

          orderBy: {
            date: "desc",
          },

          take: 10,
        },

        _count: {
          select: {
            orders: true,
            reservations: true,
            reviews: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("CUSTOMER DETAIL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customer",
      },
      { status: 500 },
    );
  }
}

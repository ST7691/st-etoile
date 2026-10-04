import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.user.id,
      },

      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        subtotal: true,
        deliveryFee: true,
        discount: true,
        total: true,
        notes: true,
        createdAt: true,
        updatedAt: true,

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
                description: true,
              },
            },
          },
        },

        payment: {
          select: {
            method: true,
            status: true,
            transactionId: true,
            amount: true,
            paidAt: true,
          },
        },

        deliveryAddress: {
          select: {
            fullName: true,
            phone: true,
            address: true,
            city: true,
            area: true,
            postalCode: true,
            instructions: true,
          },
        },
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

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("ORDER DETAILS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load order.",
      },
      { status: 500 },
    );
  }
}

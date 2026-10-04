import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `ST-${timestamp}-${random}`;
}

export async function GET() {
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

    const orders = await prisma.order.findMany({
      where: {
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
        createdAt: true,

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
            transactionId: true,
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
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load orders.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();

    const {
      fullName,
      phone,
      address,
      city,
      area,
      postalCode,
      instructions,
      notes,
      paymentMethod,
    } = body;

    if (!fullName || !phone || !address || !city) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name, phone, address and city are required.",
        },
        { status: 400 },
      );
    }

    const allowedPayments = ["COD", "SSLCOMMERZ", "STRIPE"];

    if (!allowedPayments.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        { status: 400 },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    const unavailableItem = cart.items.find((item) => !item.menuItem.available);

    if (unavailableItem) {
      return NextResponse.json(
        {
          success: false,
          message: `${unavailableItem.menuItem.name} is currently unavailable.`,
        },
        { status: 400 },
      );
    }

    // IMPORTANT:
    // Calculate prices from database.
    const subtotal = cart.items.reduce(
      (total, item) =>
        total + Number(item.menuItem.price) * Number(item.quantity),
      0,
    );

    const deliveryFee = 100;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    const order = await prisma.$transaction(async (tx) => {
      const deliveryAddress = await tx.deliveryAddress.create({
        data: {
          fullName: String(fullName).trim(),
          phone: String(phone).trim(),
          address: String(address).trim(),
          city: String(city).trim(),
          area: area ? String(area).trim() : null,
          postalCode: postalCode ? String(postalCode).trim() : null,
          instructions: instructions ? String(instructions).trim() : null,
        },
      });

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),

          userId: session.user.id,

          deliveryAddressId: deliveryAddress.id,

          status: "PENDING",

          paymentMethod,

          subtotal,
          deliveryFee,
          discount,
          total,

          notes: notes ? String(notes).trim() : null,

          items: {
            create: cart.items.map((item) => ({
              quantity: item.quantity,
              price: Number(item.menuItem.price),
              menuItemId: item.menuItem.id,
            })),
          },

          payment: {
            create: {
              method: paymentMethod,
              status: "PENDING",
              amount: total,
            },
          },
        },

        include: {
          items: {
            include: {
              menuItem: true,
            },
          },

          deliveryAddress: true,

          payment: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      order,
      cartItemCount: 0,
    });
  } catch (error) {
    console.error("ORDER CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order.",
      },
      { status: 500 },
    );
  }
}

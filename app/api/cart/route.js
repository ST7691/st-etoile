import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
      });
    }

    const items = cart.items;

    const subtotal = items.reduce((total, item) => {
      return total + Number(item.menuItem.price) * item.quantity;
    }, 0);

    const itemCount = items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        items,
        subtotal,
        itemCount,
      },
    });
  } catch (error) {
    console.error("CART GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load cart",
        error: error.message,
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
          message: "Please login first",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const menuItemId = body?.menuItemId;
    const quantity = Number(body?.quantity || 1);

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item ID is required",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid quantity",
        },
        { status: 400 },
      );
    }

    // Find dish
    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Dish not found",
        },
        { status: 404 },
      );
    }

    // IMPORTANT
    // Current Prisma schema uses `available`
    if (!menuItem.available) {
      return NextResponse.json(
        {
          success: false,
          message: "This dish is currently unavailable.",
        },
        { status: 400 },
      );
    }

    // Find or create user's cart
    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Check existing item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId: menuItem.id,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: menuItem.id,
          quantity,
        },
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const items = updatedCart?.items || [];

    const subtotal = items.reduce((total, item) => {
      return total + Number(item.menuItem.price) * item.quantity;
    }, 0);

    const itemCount = items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      data: {
        items,
        subtotal,
        itemCount,
      },
    });
  } catch (error) {
    console.error("CART POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

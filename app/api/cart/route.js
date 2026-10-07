import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Build lightweight cart response
 */
async function getCartData(userId) {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      items: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          quantity: true,
          menuItem: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              oldPrice: true,
              image: true,
              rating: true,
              available: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      itemCount: 0,
    };
  }

  let subtotal = 0;
  let itemCount = 0;

  for (const item of cart.items) {
    subtotal += Number(item.menuItem.price) * item.quantity;
    itemCount += item.quantity;
  }

  return {
    items: cart.items,
    subtotal,
    itemCount,
  };
}

/**
 * GET CART
 */
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

    const data = await getCartData(session.user.id);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load cart",
      },
      { status: 500 },
    );
  }
}

/**
 * ADD TO CART
 */
export async function POST(request) {
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

    const body = await request.json();

    const menuItemId = body?.menuItemId;
    const quantity = Number(body?.quantity ?? 1);

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid quantity.",
        },
        { status: 400 },
      );
    }

    // Only fetch required fields
    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
      select: {
        id: true,
        name: true,
        available: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found.",
        },
        { status: 404 },
      );
    }

    if (!menuItem.available) {
      return NextResponse.json(
        {
          success: false,
          message: "This dish is currently unavailable.",
        },
        { status: 400 },
      );
    }

    // Create cart only if it doesn't exist
    const cart = await prisma.cart.upsert({
      where: {
        userId: session.user.id,
      },
      update: {},
      create: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    // Add/update item
    await prisma.cartItem.upsert({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        menuItemId,
        quantity,
      },
    });

    // Return updated cart
    const data = await getCartData(session.user.id);

    return NextResponse.json(
      {
        success: true,
        message: `${menuItem.name} added to cart.`,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("POST CART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add item to cart.",
      },
      { status: 500 },
    );
  }
}

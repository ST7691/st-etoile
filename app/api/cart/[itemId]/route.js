import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUpdatedCart(userId) {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    select: {
      items: {
        orderBy: {
          createdAt: "asc",
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
 * PATCH
 * Update quantity
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const { itemId } = await params;

    const body = await request.json();
    const quantity = Number(body?.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        {
          status: 400,
        },
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity,
      },
    });

    const data = await getUpdatedCart(session.user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Cart updated successfully.",
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
    console.error("PATCH /api/cart/[itemId] ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update cart item.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE
 * Remove cart item
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const { itemId } = await params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    const data = await getUpdatedCart(session.user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Item removed from cart.",
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
    console.error("DELETE /api/cart/[itemId] ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove cart item.",
      },
      {
        status: 500,
      },
    );
  }
}

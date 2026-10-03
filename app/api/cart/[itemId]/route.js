import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const CART_COOKIE = "st_cart_session";

async function getSessionId() {
  const cookieStore = await cookies();

  return cookieStore.get(CART_COOKIE)?.value;
}

export async function PATCH(request, { params }) {
  try {
    const { itemId } = await params;

    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return Response.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        { status: 400 },
      );
    }

    const sessionId = await getSessionId();

    if (!sessionId) {
      return Response.json(
        {
          success: false,
          message: "Cart session not found.",
        },
        { status: 404 },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        sessionId,
      },
    });

    if (!cart) {
      return Response.json(
        {
          success: false,
          message: "Cart not found.",
        },
        { status: 404 },
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return Response.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        { status: 404 },
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
      include: {
        menuItem: {
          include: {
            category: true,
          },
        },
      },
    });

    return Response.json({
      success: true,
      message: "Cart updated successfully.",
      data: updatedItem,
    });
  } catch (error) {
    console.error("PATCH /api/cart/[itemId] error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update cart item.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { itemId } = await params;

    const sessionId = await getSessionId();

    if (!sessionId) {
      return Response.json(
        {
          success: false,
          message: "Cart session not found.",
        },
        { status: 404 },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        sessionId,
      },
    });

    if (!cart) {
      return Response.json(
        {
          success: false,
          message: "Cart not found.",
        },
        { status: 404 },
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return Response.json(
        {
          success: false,
          message: "Cart item not found.",
        },
        { status: 404 },
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return Response.json({
      success: true,
      message: "Item removed from cart.",
    });
  } catch (error) {
    console.error("DELETE /api/cart/[itemId] error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to remove cart item.",
      },
      { status: 500 },
    );
  }
}

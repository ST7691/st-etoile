import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUpdatedCart(userId) {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },

    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },

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

  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      itemCount: 0,
    };
  }

  const subtotal = cart.items.reduce(
    (total, item) => total + Number(item.menuItem.price) * item.quantity,
    0,
  );

  const itemCount = cart.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return {
    items: cart.items,
    subtotal,
    itemCount,
  };
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
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

    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return Response.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        {
          status: 400,
        },
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!cart) {
      return Response.json(
        {
          success: false,
          message: "Cart not found.",
        },
        {
          status: 404,
        },
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

    const updatedCart = await getUpdatedCart(session.user.id);

    return Response.json({
      success: true,
      message: "Cart updated successfully.",
      ...updatedCart,
    });
  } catch (error) {
    console.error("PATCH /api/cart/[itemId] error:", error);

    return Response.json(
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

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
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

    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!cart) {
      return Response.json(
        {
          success: false,
          message: "Cart not found.",
        },
        {
          status: 404,
        },
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

    const updatedCart = await getUpdatedCart(session.user.id);

    return Response.json({
      success: true,
      message: "Item removed from cart.",
      ...updatedCart,
    });
  } catch (error) {
    console.error("DELETE /api/cart/[itemId] error:", error);

    return Response.json(
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

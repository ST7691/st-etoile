import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const CART_COOKIE = "st_cart_session";

async function getOrCreateSessionId() {
  const cookieStore = await cookies();

  let sessionId = cookieStore.get(CART_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();

    cookieStore.set(CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return sessionId;
}

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();

    const cart = await prisma.cart.findUnique({
      where: {
        sessionId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "desc",
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
      return Response.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          itemCount: 0,
        },
      });
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      menuItem: item.menuItem,
    }));

    const subtotal = items.reduce((total, item) => {
      return total + Number(item.menuItem.price) * item.quantity;
    }, 0);

    const itemCount = items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return Response.json({
      success: true,
      data: {
        id: cart.id,
        items,
        subtotal,
        itemCount,
      },
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch cart.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { menuItemId, quantity = 1 } = body;

    if (!menuItemId) {
      return Response.json(
        {
          success: false,
          message: "menuItemId is required.",
        },
        { status: 400 },
      );
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return Response.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        { status: 400 },
      );
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
      },
    });

    if (!menuItem) {
      return Response.json(
        {
          success: false,
          message: "Menu item not found.",
        },
        { status: 404 },
      );
    }

    if (!menuItem.available) {
      return Response.json(
        {
          success: false,
          message: "This dish is currently unavailable.",
        },
        { status: 400 },
      );
    }

    const sessionId = await getOrCreateSessionId();

    const cart = await prisma.cart.upsert({
      where: {
        sessionId,
      },
      update: {},
      create: {
        sessionId,
      },
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + parsedQuantity,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId,
          quantity: parsedQuantity,
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });
    }

    return Response.json(
      {
        success: true,
        message: "Item added to cart.",
        data: cartItem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/cart error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to add item to cart.",
      },
      { status: 500 },
    );
  }
}

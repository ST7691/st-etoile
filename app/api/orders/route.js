import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const DELIVERY_FEE = 100;

const ALLOWED_PAYMENT_METHODS = ["COD", "SSLCOMMERZ", "STRIPE"];

/*
|--------------------------------------------------------------------------
| Generate Order Number
|--------------------------------------------------------------------------
*/

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);

  const random = Math.floor(100 + Math.random() * 900);

  return `ST-${timestamp}-${random}`;
}

/*
|--------------------------------------------------------------------------
| GET /api/orders
|--------------------------------------------------------------------------
| Get logged-in user's orders
|--------------------------------------------------------------------------
*/

export async function GET() {
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
              },
            },
          },
        },

        payment: {
          select: {
            status: true,
            method: true,
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
      {
        status: 500,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/orders
|--------------------------------------------------------------------------
| Create new order
|
| Supported:
| - COD
| - SSLCOMMERZ
| - STRIPE
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    /*
     * ---------------------------------------------------------------
     * 1. Authentication
     * ---------------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------------
     * 2. Read request body
     * ---------------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------------
     * 3. Validate delivery information
     * ---------------------------------------------------------------
     */

    if (!fullName || !String(fullName).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone || !String(phone).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!address || !String(address).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery address is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!city || !String(city).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 4. Validate payment method
     * ---------------------------------------------------------------
     */

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 5. Get user's cart
     * ---------------------------------------------------------------
     */

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

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Your cart is empty.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 6. Validate cart items
     * ---------------------------------------------------------------
     *
     * IMPORTANT:
     * We do NOT trust price/total coming from frontend.
     *
     * Price is always taken from MenuItem in database.
     * ---------------------------------------------------------------
     */

    const invalidCartItem = cart.items.find((item) => !item.menuItem);

    if (invalidCartItem) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more items in your cart no longer exist.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 7. Check item availability
     * ---------------------------------------------------------------
     */

    const unavailableItem = cart.items.find(
      (item) => item.menuItem.available !== true,
    );

    if (unavailableItem) {
      return NextResponse.json(
        {
          success: false,
          code: "ITEM_UNAVAILABLE",
          message: `${unavailableItem.menuItem.name} is currently unavailable.`,
          item: {
            id: unavailableItem.menuItem.id,
            name: unavailableItem.menuItem.name,
          },
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 8. Validate quantities
     * ---------------------------------------------------------------
     */

    const invalidQuantity = cart.items.find(
      (item) =>
        !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0,
    );

    if (invalidQuantity) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more cart quantities are invalid.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------------------------
     * 9. Calculate subtotal from database
     * ---------------------------------------------------------------
     */

    const subtotal = cart.items.reduce((total, item) => {
      const price = Number(item.menuItem.price);

      const quantity = Number(item.quantity);

      return total + price * quantity;
    }, 0);

    /*
     * ---------------------------------------------------------------
     * 10. Delivery / discount / total
     * ---------------------------------------------------------------
     */

    const deliveryFee = DELIVERY_FEE;

    const discount = 0;

    const total = subtotal + deliveryFee - discount;

    /*
     * ---------------------------------------------------------------
     * 11. Generate order number
     * ---------------------------------------------------------------
     */

    const orderNumber = generateOrderNumber();

    /*
     * ---------------------------------------------------------------
     * 12. Create everything inside transaction
     * ---------------------------------------------------------------
     *
     * Creates:
     *
     * DeliveryAddress
     * Order
     * OrderItems
     * Payment
     *
     * Then clears cart.
     * ---------------------------------------------------------------
     */

    const order = await prisma.$transaction(async (tx) => {
      /*
       * ---------------------------------------------------------
       * Delivery address
       * ---------------------------------------------------------
       */

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

      /*
       * ---------------------------------------------------------
       * Create order
       * ---------------------------------------------------------
       */

      const newOrder = await tx.order.create({
        data: {
          orderNumber,

          userId: session.user.id,

          deliveryAddressId: deliveryAddress.id,

          /*
           * Payment is still pending.
           *
           * Stripe/SSLCommerz will change
           * this after successful payment.
           */

          status: "PENDING",

          paymentMethod,

          subtotal,

          deliveryFee,

          discount,

          total,

          notes: notes ? String(notes).trim() : null,

          /*
           * ---------------------------------------------------
           * Order Items
           * ---------------------------------------------------
           */

          items: {
            create: cart.items.map((item) => ({
              quantity: Number(item.quantity),

              price: Number(item.menuItem.price),

              menuItemId: item.menuItem.id,
            })),
          },

          /*
           * ---------------------------------------------------
           * Payment
           * ---------------------------------------------------
           */

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

      /*
       * ---------------------------------------------------------
       * Clear cart only after successful
       * order creation.
       * ---------------------------------------------------------
       */

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return newOrder;
    });

    /*
     * ---------------------------------------------------------------
     * 13. Create admin notification
     * ---------------------------------------------------------------
     *
     * Global notification:
     * userId = null
     *
     * Admin/Staff notification bell
     * will receive this notification.
     * ---------------------------------------------------------------
     */

    const notification = await createNotification({
      type: "ORDER",

      title: "New Order Received",

      message: `Order #${order.orderNumber} has been placed. Total: ৳${Number(
        order.total,
      ).toFixed(2)}.`,

      link: "/dashboard/orders",

      userId: null,
    });

    /*
     * ---------------------------------------------------------------
     * 14. Return successful response
     * ---------------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          paymentMethod === "COD"
            ? "Order placed successfully."
            : "Order created successfully. Payment is pending.",

        order,

        cartItemCount: 0,

        notificationCreated: Boolean(notification),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /*
     * ---------------------------------------------------------------
     * Global error handler
     * ---------------------------------------------------------------
     */

    console.error("ORDER CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create order.",
      },
      {
        status: 500,
      },
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const ALLOWED_ROLES = ["ADMIN", "STAFF"];

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

/*
 * ---------------------------------------------------------------
 * AUTHORIZATION
 * ---------------------------------------------------------------
 *
 * IMPORTANT:
 * Do not trust only session.user.role.
 * The current role is verified directly from PostgreSQL.
 *
 * This fixes:
 * /api/admin/orders -> 403 Access denied
 * when JWT/session contains an old CUSTOMER role.
 */

async function getAuthorizedUser() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        authorized: false,
        status: 401,
        message: "Unauthorized.",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!dbUser) {
      return {
        authorized: false,
        status: 401,
        message: "User account not found.",
      };
    }

    const dbRole = String(dbUser.role || "")
      .trim()
      .toUpperCase();

    console.log("===== ADMIN ORDERS AUTH =====");
    console.log("USER ID:", dbUser.id);
    console.log("USER EMAIL:", dbUser.email);
    console.log("SESSION ROLE:", session.user.role);
    console.log("DATABASE ROLE:", dbUser.role);
    console.log("=============================");

    if (!ALLOWED_ROLES.includes(dbRole)) {
      console.error("ADMIN ORDERS ACCESS DENIED:", {
        userId: dbUser.id,
        email: dbUser.email,
        sessionRole: session.user.role,
        databaseRole: dbUser.role,
      });

      return {
        authorized: false,
        status: 403,
        message: "Access denied.",
      };
    }

    return {
      authorized: true,
      session,
      user: dbUser,
      role: dbRole,
    };
  } catch (error) {
    console.error("ADMIN AUTHORIZATION ERROR:", error);

    return {
      authorized: false,
      status: 500,
      message: "Authorization check failed.",
    };
  }
}

/*
 * ---------------------------------------------------------------
 * FORMAT STATUS
 * ---------------------------------------------------------------
 */

function formatStatus(status) {
  if (!status) {
    return "";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/*
 * ---------------------------------------------------------------
 * CUSTOMER ORDER NOTIFICATION CONTENT
 * ---------------------------------------------------------------
 */

function getOrderNotification(status, orderNumber) {
  switch (status) {
    case "CONFIRMED":
      return {
        title: "Order Confirmed 🎉",
        message: `Your order #${orderNumber} has been confirmed. We are getting it ready for you.`,
      };

    case "PREPARING":
      return {
        title: "Your Food Is Being Prepared 👨‍🍳",
        message: `We're preparing your order #${orderNumber}. Your delicious meal will be ready soon.`,
      };

    case "OUT_FOR_DELIVERY":
      return {
        title: "Your Order Is On The Way 🚴",
        message: `Your order #${orderNumber} is out for delivery and will arrive soon.`,
      };

    case "DELIVERED":
      return {
        title: "Order Delivered 🎉",
        message: `Your order #${orderNumber} has been delivered successfully. Enjoy your meal!`,
      };

    case "CANCELLED":
      return {
        title: "Order Cancelled",
        message: `Your order #${orderNumber} has been cancelled.`,
      };

    case "PENDING":
      return {
        title: "Order Pending",
        message: `Your order #${orderNumber} is currently pending confirmation.`,
      };

    default:
      return {
        title: "Order Status Updated",
        message: `Your order #${orderNumber} is now ${formatStatus(status)}.`,
      };
  }
}

/*
 * ---------------------------------------------------------------
 * PAYMENT NOTIFICATION CONTENT
 * ---------------------------------------------------------------
 */

function getPaymentNotification(paymentStatus, orderNumber) {
  switch (paymentStatus) {
    case "PAID":
      return {
        title: "Payment Successful 💳",
        message: `Payment for order #${orderNumber} has been received successfully.`,
      };

    case "FAILED":
      return {
        title: "Payment Failed",
        message: `Payment for order #${orderNumber} has failed.`,
      };

    case "REFUNDED":
      return {
        title: "Payment Refunded",
        message: `Payment for order #${orderNumber} has been refunded successfully.`,
      };

    case "PENDING":
      return {
        title: "Payment Pending",
        message: `Payment for order #${orderNumber} is currently pending.`,
      };

    default:
      return {
        title: "Payment Status Updated",
        message: `Payment for order #${orderNumber} is now ${formatStatus(
          paymentStatus,
        )}.`,
      };
  }
}

/*
 * ---------------------------------------------------------------
 * GET - ADMIN / STAFF ORDERS
 * ---------------------------------------------------------------
 */

export async function GET(request) {
  try {
    const access = await getAuthorizedUser();

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const search = searchParams.get("search")?.trim() || "";

    /*
     * -----------------------------------------------------------
     * Validate filters
     * -----------------------------------------------------------
     */

    if (status && status !== "ALL" && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      paymentStatus &&
      paymentStatus !== "ALL" &&
      !PAYMENT_STATUSES.includes(paymentStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Build Where
     * -----------------------------------------------------------
     */

    const where = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.payment = {
        is: {
          status: paymentStatus,
        },
      };
    }

    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: "insensitive",
          },
        },

        {
          user: {
            is: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },

        {
          user: {
            is: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    /*
     * -----------------------------------------------------------
     * Get Orders
     * -----------------------------------------------------------
     */

    const orders = await prisma.order.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },

        deliveryAddress: true,

        payment: true,

        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    });

    /*
     * -----------------------------------------------------------
     * Stats
     * -----------------------------------------------------------
     */

    const [
      total,
      pending,
      confirmed,
      preparing,
      outForDelivery,
      delivered,
      cancelled,
      paid,
      failed,
      refunded,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.order.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      prisma.order.count({
        where: {
          status: "PREPARING",
        },
      }),

      prisma.order.count({
        where: {
          status: "OUT_FOR_DELIVERY",
        },
      }),

      prisma.order.count({
        where: {
          status: "DELIVERED",
        },
      }),

      prisma.order.count({
        where: {
          status: "CANCELLED",
        },
      }),

      prisma.payment.count({
        where: {
          status: "PAID",
        },
      }),

      prisma.payment.count({
        where: {
          status: "FAILED",
        },
      }),

      prisma.payment.count({
        where: {
          status: "REFUNDED",
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,

        orders,

        stats: {
          total,
          pending,
          confirmed,
          preparing,
          outForDelivery,
          delivered,
          cancelled,
          paid,
          failed,
          refunded,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("ADMIN ORDERS GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load admin orders.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * ---------------------------------------------------------------
 * PATCH - UPDATE ORDER / PAYMENT STATUS
 * ---------------------------------------------------------------
 */

export async function PATCH(request) {
  try {
    /*
     * -----------------------------------------------------------
     * Authorization
     * -----------------------------------------------------------
     */

    const access = await getAuthorizedUser();

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Parse Request Body
     * -----------------------------------------------------------
     */

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const { orderId, orderStatus, paymentStatus } = body || {};

    /*
     * -----------------------------------------------------------
     * Validate Order ID
     * -----------------------------------------------------------
     */

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Validate At Least One Update
     * -----------------------------------------------------------
     */

    if (!orderStatus && !paymentStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Order status or payment status is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Validate Order Status
     * -----------------------------------------------------------
     */

    if (orderStatus && !ORDER_STATUSES.includes(orderStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Validate Payment Status
     * -----------------------------------------------------------
     */

    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment status.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Find Existing Order
     * -----------------------------------------------------------
     */

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        payment: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * Detect Actual Changes
     * -----------------------------------------------------------
     */

    const orderStatusChanged =
      Boolean(orderStatus) && orderStatus !== existingOrder.status;

    const paymentStatusChanged =
      Boolean(paymentStatus) && paymentStatus !== existingOrder.payment?.status;

    /*
     * -----------------------------------------------------------
     * Prevent Duplicate Update / Notification
     * -----------------------------------------------------------
     */

    if (!orderStatusChanged && !paymentStatusChanged) {
      return NextResponse.json(
        {
          success: true,
          message: "No changes detected.",
          order: existingOrder,
        },
        {
          status: 200,
        },
      );
    }

    /*
     * -----------------------------------------------------------
     * DATABASE TRANSACTION
     * -----------------------------------------------------------
     */

    const updatedOrder = await prisma.$transaction(async (tx) => {
      /*
       * Update Order
       */

      if (orderStatusChanged) {
        await tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            status: orderStatus,
          },
        });
      }

      /*
       * Update Payment
       */

      if (paymentStatusChanged) {
        if (!existingOrder.payment) {
          throw new Error("Payment record not found for this order.");
        }

        const paymentData = {
          status: paymentStatus,
        };

        /*
         * PAID
         */

        if (paymentStatus === "PAID") {
          paymentData.paidAt = existingOrder.payment.paidAt || new Date();
        }

        /*
         * FAILED / PENDING
         */

        if (paymentStatus === "FAILED" || paymentStatus === "PENDING") {
          paymentData.paidAt = null;
        }

        /*
         * REFUNDED
         *
         * Keep existing paidAt.
         */

        if (paymentStatus === "REFUNDED") {
          paymentData.paidAt = existingOrder.payment.paidAt;
        }

        await tx.payment.update({
          where: {
            orderId,
          },

          data: paymentData,
        });
      }

      /*
       * Return Updated Order
       */

      return tx.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },

          deliveryAddress: true,

          payment: true,

          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
        },
      });
    });

    /*
     * -----------------------------------------------------------
     * CUSTOMER ORDER NOTIFICATION
     * -----------------------------------------------------------
     *
     * IMPORTANT:
     * userId = existingOrder.userId
     *
     * This notification belongs ONLY to the customer.
     */

    if (orderStatusChanged && existingOrder.userId) {
      const notification = getOrderNotification(
        orderStatus,
        existingOrder.orderNumber,
      );

      await createNotification({
        type: "ORDER",

        title: notification.title,

        message: notification.message,

        link: "/dashboard/orders",

        userId: existingOrder.userId,
      });
    }

    /*
     * -----------------------------------------------------------
     * ADMIN GLOBAL ORDER NOTIFICATION
     * -----------------------------------------------------------
     *
     * userId = null
     *
     * This is ONLY for the admin/staff notification system.
     */

    if (orderStatusChanged) {
      await createNotification({
        type: "ORDER",

        title: "Order Status Updated",

        message: `Order #${
          existingOrder.orderNumber
        } is now ${formatStatus(orderStatus)}.`,

        link: "/dashboard/orders",

        userId: null,
      });
    }

    /*
     * -----------------------------------------------------------
     * CUSTOMER PAYMENT NOTIFICATION
     * -----------------------------------------------------------
     */

    if (paymentStatusChanged && existingOrder.userId) {
      const notification = getPaymentNotification(
        paymentStatus,
        existingOrder.orderNumber,
      );

      await createNotification({
        type: "PAYMENT",

        title: notification.title,

        message: notification.message,

        link: "/dashboard/orders",

        userId: existingOrder.userId,
      });
    }

    /*
     * -----------------------------------------------------------
     * ADMIN GLOBAL PAYMENT NOTIFICATION
     * -----------------------------------------------------------
     */

    if (paymentStatusChanged) {
      await createNotification({
        type: "PAYMENT",

        title: "Payment Status Updated",

        message: `Payment for order #${
          existingOrder.orderNumber
        } is now ${formatStatus(paymentStatus)}.`,

        link: "/dashboard/orders",

        userId: null,
      });
    }

    /*
     * -----------------------------------------------------------
     * SUCCESS
     * -----------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message: "Order updated successfully.",

        order: updatedOrder,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("ADMIN ORDERS PATCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update order.",
      },
      {
        status: 500,
      },
    );
  }
}

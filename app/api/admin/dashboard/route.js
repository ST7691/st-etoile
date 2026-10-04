import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "STAFF"];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        { status: 403 },
      );
    }

    // -----------------------------------------
    // Date ranges
    // -----------------------------------------

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // -----------------------------------------
    // Parallel database queries
    // -----------------------------------------

    const [
      totalOrders,
      todayOrders,
      totalCustomers,
      pendingOrders,
      preparingOrders,
      confirmedReservations,
      pendingReservations,
      totalReservations,
      revenueResult,
      recentOrders,
      recentReservations,
      salesOrders,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Customers
      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      // Pending orders
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),

      // Preparing orders
      prisma.order.count({
        where: {
          status: "PREPARING",
        },
      }),

      // Confirmed reservations
      prisma.reservation.count({
        where: {
          status: "CONFIRMED",
        },
      }),

      // Pending reservations
      prisma.reservation.count({
        where: {
          status: "PENDING",
        },
      }),

      // Total reservations
      prisma.reservation.count(),

      // Revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: {
            not: "CANCELLED",
          },
        },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 6,
        orderBy: {
          createdAt: "desc",
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

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },

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
        },
      }),

      // Recent reservations
      prisma.reservation.findMany({
        take: 6,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          date: true,
          time: true,
          guests: true,
          status: true,
          specialNote: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),

      // Sales for chart
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    // -----------------------------------------
    // Build 7-day sales chart
    // -----------------------------------------

    const salesMap = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);

      date.setDate(sevenDaysAgo.getDate() + i);

      const key = date.toISOString().split("T")[0];

      salesMap[key] = {
        date: key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: 0,
      };
    }

    for (const order of salesOrders) {
      const key = order.createdAt.toISOString().split("T")[0];

      if (salesMap[key]) {
        salesMap[key].revenue += Number(order.total || 0);
      }
    }

    const salesChart = Object.values(salesMap);

    // -----------------------------------------
    // Revenue
    // -----------------------------------------

    const totalRevenue = Number(revenueResult?._sum?.total || 0);

    // -----------------------------------------
    // Today's revenue
    // -----------------------------------------

    const todayRevenueOrders = salesOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      return orderDate >= todayStart && orderDate <= todayEnd;
    });

    const todayRevenue = todayRevenueOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    // -----------------------------------------
    // Response
    // -----------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        stats: {
          totalRevenue,
          todayRevenue,

          totalOrders,
          todayOrders,

          totalCustomers,

          pendingOrders,
          preparingOrders,

          pendingReservations,
          confirmedReservations,
          totalReservations,
        },

        salesChart,

        recentOrders,

        recentReservations,
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

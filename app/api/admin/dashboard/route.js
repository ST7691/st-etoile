import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const role = session.user.role;

    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      totalCustomers,
      pendingOrders,
      preparingOrders,
      revenue,
      todayRevenue,
      monthRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.order.count({
        where: {
          status: "PREPARING",
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: monthStart,
            lte: todayEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.order.findMany({
        take: 8,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          total: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          payment: {
            select: {
              status: true,
              method: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        stats: {
          totalRevenue: revenue._sum.amount || 0,

          todayRevenue: todayRevenue._sum.amount || 0,

          monthRevenue: monthRevenue._sum.amount || 0,

          totalOrders,

          todayOrders,

          totalCustomers,

          pendingOrders,

          preparingOrders,
        },

        recentOrders,
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load dashboard.",
      },
      {
        status: 500,
      },
    );
  }
}

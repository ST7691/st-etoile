import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "STAFF"];

export async function GET(request) {
  try {
    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    // =========================================================
    // DATABASE-BACKED ROLE CHECK
    // =========================================================

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
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 401 },
      );
    }

    const dbRole = String(dbUser.role || "")
      .trim()
      .toUpperCase();

    if (!ALLOWED_ROLES.includes(dbRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin or staff access required.",
        },
        { status: 403 },
      );
    }

    // =========================================================
    // RANGE
    // =========================================================

    const { searchParams } = new URL(request.url);

    const rangeParam = Number(searchParams.get("range") || 30);

    const range = [7, 30, 90, 365].includes(rangeParam) ? rangeParam : 30;

    const now = new Date();

    const startDate = new Date(now);

    startDate.setDate(startDate.getDate() - range);

    // =========================================================
    // BASIC ORDER STATISTICS
    // =========================================================

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },

      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        total: true,
        createdAt: true,

        payment: {
          select: {
            status: true,
            amount: true,
            method: true,
          },
        },

        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order) => order.status === "PENDING",
    ).length;

    const confirmedOrders = orders.filter(
      (order) => order.status === "CONFIRMED",
    ).length;

    const preparingOrders = orders.filter(
      (order) => order.status === "PREPARING",
    ).length;

    const deliveryOrders = orders.filter(
      (order) => order.status === "OUT_FOR_DELIVERY",
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "DELIVERED",
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === "CANCELLED",
    ).length;

    // =========================================================
    // REVENUE
    // =========================================================

    const paidOrders = orders.filter(
      (order) => String(order.payment?.status || "").toUpperCase() === "PAID",
    );

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    const averageOrderValue =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // =========================================================
    // TODAY'S REVENUE
    // =========================================================

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const todayPaidOrders = paidOrders.filter(
      (order) => new Date(order.createdAt) >= todayStart,
    );

    const todayRevenue = todayPaidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    );

    // =========================================================
    // PAYMENT STATISTICS
    // =========================================================

    const paidPayments = orders.filter(
      (order) => String(order.payment?.status || "").toUpperCase() === "PAID",
    ).length;

    const pendingPayments = orders.filter(
      (order) =>
        String(order.payment?.status || "").toUpperCase() === "PENDING",
    ).length;

    const failedPayments = orders.filter(
      (order) => String(order.payment?.status || "").toUpperCase() === "FAILED",
    ).length;

    const refundedPayments = orders.filter(
      (order) =>
        String(order.payment?.status || "").toUpperCase() === "REFUNDED",
    ).length;

    // =========================================================
    // PAYMENT METHOD BREAKDOWN
    // =========================================================

    const paymentMethodMap = {};

    orders.forEach((order) => {
      const method = order.payment?.method || order.paymentMethod || "UNKNOWN";

      if (!paymentMethodMap[method]) {
        paymentMethodMap[method] = {
          method,
          orders: 0,
          revenue: 0,
        };
      }

      paymentMethodMap[method].orders += 1;

      if (String(order.payment?.status || "").toUpperCase() === "PAID") {
        paymentMethodMap[method].revenue += Number(order.total || 0);
      }
    });

    const paymentMethods = Object.values(paymentMethodMap).map((item) => ({
      ...item,
      revenue: Number(item.revenue.toFixed(2)),
    }));

    // =========================================================
    // DAILY REVENUE CHART
    // =========================================================

    const revenueMap = {};

    paidOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];

      if (!revenueMap[date]) {
        revenueMap[date] = {
          revenue: 0,
          orders: 0,
        };
      }

      revenueMap[date].revenue += Number(order.total || 0);

      revenueMap[date].orders += 1;
    });

    const revenueChart = [];

    for (let i = range - 1; i >= 0; i--) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const key = date.toISOString().split("T")[0];

      revenueChart.push({
        date: key,

        revenue: Number((revenueMap[key]?.revenue || 0).toFixed(2)),

        orders: revenueMap[key]?.orders || 0,
      });
    }

    // =========================================================
    // TOP SELLING ITEMS
    // =========================================================

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
          },

          status: {
            not: "CANCELLED",
          },
        },
      },

      select: {
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
    });

    const itemMap = {};

    orderItems.forEach((item) => {
      if (!item.menuItem) {
        return;
      }

      const id = item.menuItem.id;

      if (!itemMap[id]) {
        itemMap[id] = {
          id,
          name: item.menuItem.name,
          image: item.menuItem.image,
          quantity: 0,
          revenue: 0,
        };
      }

      itemMap[id].quantity += Number(item.quantity || 0);

      itemMap[id].revenue +=
        Number(item.price || 0) * Number(item.quantity || 0);
    });

    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        revenue: Number(item.revenue.toFixed(2)),
      }));

    // =========================================================
    // RECENT ORDERS
    // =========================================================

    const recentOrders = orders.slice(0, 10).map((order) => ({
      id: order.id,

      orderNumber: order.orderNumber,

      customer: order.user?.name || order.user?.email || "Customer",

      status: order.status,

      paymentStatus: order.payment?.status || "PENDING",

      paymentMethod: order.payment?.method || order.paymentMethod,

      total: Number(order.total || 0),

      createdAt: order.createdAt,
    }));

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      range,

      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),

        todayRevenue: Number(todayRevenue.toFixed(2)),

        totalOrders,

        averageOrderValue: Number(averageOrderValue.toFixed(2)),

        pendingOrders,
        confirmedOrders,
        preparingOrders,
        deliveryOrders,
        deliveredOrders,
        cancelledOrders,

        paidPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
      },

      paymentMethods,

      revenueChart,

      topSellingItems,

      recentOrders,
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load analytics.",
      },
      {
        status: 500,
      },
    );
  }
}

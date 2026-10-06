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

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getLastDays(days) {
  const result = [];

  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    result.push({
      date: formatDate(date),
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: 0,
      transactions: 0,
    });
  }

  return result;
}

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") || "7d";

    const now = new Date();

    let startDate;
    let chartDays;

    if (range === "today") {
      startDate = startOfDay(now);
      chartDays = 1;
    } else if (range === "7d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate = startOfDay(startDate);
      chartDays = 7;
    } else if (range === "30d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate = startOfDay(startDate);
      chartDays = 30;
    } else if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = startOfDay(startDate);

      chartDays = Math.ceil(
        (endOfDay(now) - startDate) / (1000 * 60 * 60 * 24),
      );
    } else if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);

      startDate = startOfDay(startDate);

      chartDays = 365;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid analytics range.",
        },
        { status: 400 },
      );
    }

    const endDate = endOfDay(now);

    const payments = await prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        method: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const paidTransactions = payments.length;

    const averageOrderValue =
      paidTransactions > 0 ? totalRevenue / paidTransactions : 0;

    const chartData =
      range === "year"
        ? Array.from({ length: 12 }, (_, index) => {
            const monthDate = new Date(now.getFullYear(), index, 1);

            return {
              date: `${now.getFullYear()}-${String(index + 1).padStart(
                2,
                "0",
              )}`,
              label: monthDate.toLocaleDateString("en-US", {
                month: "short",
              }),
              revenue: 0,
              transactions: 0,
            };
          })
        : getLastDays(chartDays);

    for (const payment of payments) {
      if (!payment.paidAt) continue;

      const paymentDate = new Date(payment.paidAt);

      if (range === "year") {
        const monthIndex = paymentDate.getMonth();

        chartData[monthIndex].revenue += Number(payment.amount || 0);

        chartData[monthIndex].transactions += 1;
      } else {
        const dateKey = formatDate(paymentDate);

        const point = chartData.find((item) => item.date === dateKey);

        if (point) {
          point.revenue += Number(payment.amount || 0);

          point.transactions += 1;
        }
      }
    }

    const paymentMethods = {};

    for (const payment of payments) {
      const method = payment.method || "UNKNOWN";

      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          method,
          revenue: 0,
          transactions: 0,
        };
      }

      paymentMethods[method].revenue += Number(payment.amount || 0);

      paymentMethods[method].transactions += 1;
    }

    const todayStart = startOfDay(now);

    const todayPayments = payments.filter((payment) => {
      if (!payment.paidAt) return false;

      const paidAt = new Date(payment.paidAt);

      return paidAt >= todayStart;
    });

    const todayRevenue = todayPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthPayments = payments.filter((payment) => {
      if (!payment.paidAt) return false;

      return new Date(payment.paidAt) >= monthStart;
    });

    const monthRevenue = monthPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        range,

        summary: {
          totalRevenue,
          paidTransactions,
          averageOrderValue,
          todayRevenue,
          monthRevenue,
        },

        chartData,

        paymentMethods: Object.values(paymentMethods),
      },
    });
  } catch (error) {
    console.error("ADMIN REVENUE ANALYTICS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load revenue analytics.",
      },
      {
        status: 500,
      },
    );
  }
}

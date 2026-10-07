import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIME_ZONE = "Asia/Dhaka";

const ALLOWED_ROLES = ["ADMIN", "STAFF"];
const ALLOWED_RANGES = ["today", "7d", "30d", "month", "year"];

const DAY_MS = 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getAmount(value) {
  return Number(value || 0);
}

/* -------------------------------------------------------------------------- */
/* Payment Date                                                               */
/* -------------------------------------------------------------------------- */

function getPaymentDate(payment) {
  return payment.paidAt || payment.updatedAt || payment.createdAt;
}

/* -------------------------------------------------------------------------- */
/* Dhaka Time                                                                 */
/* -------------------------------------------------------------------------- */

function getDhakaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
  };
}

function getDhakaDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function createDhakaDate(year, month, day) {
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0",
    )}T00:00:00+06:00`,
  );
}

function startOfDhakaToday() {
  const parts = getDhakaParts();

  return createDhakaDate(parts.year, parts.month, parts.day);
}

function startOfDhakaMonth() {
  const parts = getDhakaParts();

  return createDhakaDate(parts.year, parts.month, 1);
}

function startOfDhakaYear() {
  const parts = getDhakaParts();

  return createDhakaDate(parts.year, 1, 1);
}

function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

/* -------------------------------------------------------------------------- */
/* Range                                                                      */
/* -------------------------------------------------------------------------- */

function getRange(range) {
  const today = startOfDhakaToday();

  if (range === "today") {
    return {
      start: today,
      end: addDays(today, 1),
    };
  }

  if (range === "7d") {
    return {
      start: addDays(today, -6),
      end: addDays(today, 1),
    };
  }

  if (range === "30d") {
    return {
      start: addDays(today, -29),
      end: addDays(today, 1),
    };
  }

  if (range === "month") {
    return {
      start: startOfDhakaMonth(),
      end: addDays(today, 1),
    };
  }

  if (range === "year") {
    return {
      start: startOfDhakaYear(),
      end: addDays(today, 1),
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Chart Labels                                                               */
/* -------------------------------------------------------------------------- */

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatMonthLabel(year, month) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
  }).format(createDhakaDate(year, month, 1));
}

/* -------------------------------------------------------------------------- */
/* Daily Chart                                                                */
/* -------------------------------------------------------------------------- */

function createDailyChart(start, end) {
  const chart = [];

  let current = new Date(start);

  while (current < end) {
    chart.push({
      date: getDhakaDateKey(current),
      label: formatDayLabel(current),
      revenue: 0,
      transactions: 0,
    });

    current = addDays(current, 1);
  }

  return chart;
}

/* -------------------------------------------------------------------------- */
/* Year Chart                                                                 */
/* -------------------------------------------------------------------------- */

function createYearChart(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      date: `${year}-${String(month).padStart(2, "0")}`,
      label: formatMonthLabel(year, month),
      revenue: 0,
      transactions: 0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* REAL PAID PAYMENT QUERY                                                    */
/* -------------------------------------------------------------------------- */

async function getPaidPayments(start, end) {
  return prisma.payment.findMany({
    where: {
      status: "PAID",

      OR: [
        {
          paidAt: {
            gte: start,
            lt: end,
          },
        },
        {
          paidAt: null,
          updatedAt: {
            gte: start,
            lt: end,
          },
        },
      ],
    },

    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      transactionId: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
      orderId: true,
    },

    orderBy: {
      createdAt: "asc",
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Build Chart                                                                */
/* -------------------------------------------------------------------------- */

function buildChartData(range, selectedRange, payments) {
  if (range === "year") {
    const year = getDhakaParts(selectedRange.start).year;

    const chart = createYearChart(year);

    for (const payment of payments) {
      const paymentDate = getPaymentDate(payment);

      if (!paymentDate) continue;

      const parts = getDhakaParts(paymentDate);

      const index = parts.month - 1;

      if (!chart[index]) continue;

      chart[index].revenue += getAmount(payment.amount);
      chart[index].transactions += 1;
    }

    return chart.map((item) => ({
      ...item,
      revenue: roundMoney(item.revenue),
    }));
  }

  const chart = createDailyChart(selectedRange.start, selectedRange.end);

  const chartMap = new Map();

  for (const item of chart) {
    chartMap.set(item.date, item);
  }

  for (const payment of payments) {
    const paymentDate = getPaymentDate(payment);

    if (!paymentDate) continue;

    const dateKey = getDhakaDateKey(paymentDate);

    const point = chartMap.get(dateKey);

    if (!point) continue;

    point.revenue += getAmount(payment.amount);
    point.transactions += 1;
  }

  return chart.map((item) => ({
    ...item,
    revenue: roundMoney(item.revenue),
  }));
}

/* -------------------------------------------------------------------------- */
/* Payment Methods                                                            */
/* -------------------------------------------------------------------------- */

function buildPaymentMethods(payments) {
  const methods = new Map();

  for (const payment of payments) {
    const method = String(payment.method || "UNKNOWN")
      .trim()
      .toUpperCase();

    const existing = methods.get(method) || {
      method,
      revenue: 0,
      transactions: 0,
    };

    existing.revenue += getAmount(payment.amount);
    existing.transactions += 1;

    methods.set(method, existing);
  }

  return Array.from(methods.values())
    .map((item) => ({
      method: item.method,
      revenue: roundMoney(item.revenue),
      transactions: item.transactions,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* -------------------------------------------------------------------------- */
/* SERVER AUTH                                                                */
/* -------------------------------------------------------------------------- */

async function getAuthorizedAdmin() {
  const session = await auth();

  console.log(
    "ANALYTICS AUTH SESSION:",
    session
      ? {
          id: session.user?.id || null,
          email: session.user?.email || null,
          role: session.user?.role || null,
        }
      : null,
  );

  /*
   * No Auth.js session at all.
   */
  if (!session?.user) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized.",
    };
  }

  /*
   * We don't blindly trust role from the client/session.
   * Find the real user from PostgreSQL.
   */
  const sessionUserId = session.user.id ? String(session.user.id).trim() : "";

  const sessionEmail = session.user.email
    ? String(session.user.email).trim().toLowerCase()
    : "";

  let dbUser = null;

  /*
   * First try user ID.
   */
  if (sessionUserId) {
    dbUser = await prisma.user.findUnique({
      where: {
        id: sessionUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  /*
   * If ID is missing/stale, use email.
   */
  if (!dbUser && sessionEmail) {
    dbUser = await prisma.user.findUnique({
      where: {
        email: sessionEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  console.log(
    "ANALYTICS DATABASE USER:",
    dbUser
      ? {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        }
      : null,
  );

  if (!dbUser) {
    return {
      authorized: false,
      status: 401,
      message: "Authenticated user was not found.",
    };
  }

  const dbRole = String(dbUser.role || "")
    .trim()
    .toUpperCase();

  console.log("ANALYTICS DATABASE ROLE:", dbRole);

  if (!ALLOWED_ROLES.includes(dbRole)) {
    return {
      authorized: false,
      status: 403,
      message: "Access denied.",
    };
  }

  return {
    authorized: true,
    user: dbUser,
    role: dbRole,
  };
}

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET(request) {
  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const authorization = await getAuthorizedAdmin();

    if (!authorization.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: authorization.message,
        },
        {
          status: authorization.status,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Range                                                                   */
    /* ---------------------------------------------------------------------- */

    const { searchParams } = new URL(request.url);

    const requestedRange = searchParams.get("range") || "7d";

    if (!ALLOWED_RANGES.includes(requestedRange)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid analytics range.",
        },
        {
          status: 400,
        },
      );
    }

    const range = requestedRange;

    /* ---------------------------------------------------------------------- */
    /* Date Ranges                                                             */
    /* ---------------------------------------------------------------------- */

    const selectedRange = getRange(range);
    const todayRange = getRange("today");
    const monthRange = getRange("month");
    const yearRange = getRange("year");

    /* ---------------------------------------------------------------------- */
    /* Fetch REAL Paid Payments                                               */
    /* ---------------------------------------------------------------------- */

    const [selectedPayments, todayPayments, monthPayments, yearPayments] =
      await Promise.all([
        getPaidPayments(selectedRange.start, selectedRange.end),

        getPaidPayments(todayRange.start, todayRange.end),

        getPaidPayments(monthRange.start, monthRange.end),

        getPaidPayments(yearRange.start, yearRange.end),
      ]);

    /* ---------------------------------------------------------------------- */
    /* Selected Revenue                                                        */
    /* ---------------------------------------------------------------------- */

    const totalRevenue = selectedPayments.reduce((sum, payment) => {
      return sum + getAmount(payment.amount);
    }, 0);

    /* ---------------------------------------------------------------------- */
    /* Transactions                                                            */
    /* ---------------------------------------------------------------------- */

    const paidTransactions = selectedPayments.length;

    /* ---------------------------------------------------------------------- */
    /* Average Order Value                                                     */
    /* ---------------------------------------------------------------------- */

    const averageOrderValue =
      paidTransactions > 0 ? totalRevenue / paidTransactions : 0;

    /* ---------------------------------------------------------------------- */
    /* Today                                                                   */
    /* ---------------------------------------------------------------------- */

    const todayRevenue = todayPayments.reduce((sum, payment) => {
      return sum + getAmount(payment.amount);
    }, 0);

    const todayTransactions = todayPayments.length;

    /* ---------------------------------------------------------------------- */
    /* Month                                                                   */
    /* ---------------------------------------------------------------------- */

    const monthRevenue = monthPayments.reduce((sum, payment) => {
      return sum + getAmount(payment.amount);
    }, 0);

    /* ---------------------------------------------------------------------- */
    /* Year                                                                    */
    /* ---------------------------------------------------------------------- */

    const yearRevenue = yearPayments.reduce((sum, payment) => {
      return sum + getAmount(payment.amount);
    }, 0);

    /* ---------------------------------------------------------------------- */
    /* Chart                                                                   */
    /* ---------------------------------------------------------------------- */

    const chartData = buildChartData(range, selectedRange, selectedPayments);

    /* ---------------------------------------------------------------------- */
    /* Payment Methods                                                         */
    /* ---------------------------------------------------------------------- */

    const paymentMethods = buildPaymentMethods(selectedPayments);

    /* ---------------------------------------------------------------------- */
    /* Response                                                                */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        data: {
          range,

          summary: {
            totalRevenue: roundMoney(totalRevenue),

            paidTransactions,

            averageOrderValue: roundMoney(averageOrderValue),

            todayRevenue: roundMoney(todayRevenue),

            todayTransactions,

            monthRevenue: roundMoney(monthRevenue),

            yearRevenue: roundMoney(yearRevenue),
          },

          chartData,

          paymentMethods,

          meta: {
            currency: "BDT",

            timezone: TIME_ZONE,

            selectedRange: {
              start: selectedRange.start.toISOString(),

              end: selectedRange.end.toISOString(),
            },

            generatedAt: new Date().toISOString(),

            authenticatedUser: {
              id: authorization.user.id,
              email: authorization.user.email,
              role: authorization.role,
            },
          },
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
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

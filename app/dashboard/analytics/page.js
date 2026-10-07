"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CreditCard,
  DollarSign,
  Home,
  Loader2,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const ranges = [
  {
    label: "Today",
    value: "today",
  },
  {
    label: "7 Days",
    value: "7d",
  },
  {
    label: "30 Days",
    value: "30d",
  },
  {
    label: "This Month",
    value: "month",
  },
  {
    label: "This Year",
    value: "year",
  },
];

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMethod(method) {
  if (!method) return "Unknown";

  return String(method)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatChartDate(date) {
  if (!date) return "";

  const value = new Date(`${date}T00:00:00+06:00`);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
  });
}

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold text-white">{value}</h3>

          {subtitle && <p className="mt-2 text-xs text-white/40">{subtitle}</p>}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#d4af37]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            Revenue Performance
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Paid transaction revenue over selected period
          </p>
        </div>

        <div className="flex h-[330px] items-center justify-center rounded-2xl border border-dashed border-white/10">
          <div className="text-center">
            <BarChart3 size={32} className="mx-auto text-white/20" />

            <p className="mt-3 text-sm text-white/35">
              No revenue data available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(
    ...data.map((item) => Number(item.revenue || 0)),
    1,
  );

  const chartWidth = 1000;
  const chartHeight = 330;

  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : (index / (data.length - 1)) * chartWidth;

    const y =
      chartHeight -
      (Number(item.revenue || 0) / maxRevenue) * (chartHeight - 35);

    return {
      ...item,
      x,
      y,
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  const areaPoints = [
    `0,${chartHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${chartWidth},${chartHeight}`,
  ].join(" ");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Revenue Performance
          </h2>

          <p className="mt-1 text-sm text-white/40">
            Paid transaction revenue over selected period
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#d4af37]">
          <TrendingUp size={15} />
          Real Payment Data
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className={data.length > 14 ? "min-w-[900px]" : "min-w-full"}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 55}`}
            className="h-[330px] w-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />

                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4].map((line) => {
              const y = (chartHeight / 4) * line;

              return (
                <line
                  key={line}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon points={areaPoints} fill="url(#revenueGradient)" />

            <polyline
              points={linePoints}
              fill="none"
              stroke="#d4af37"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <g key={point.date || index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#111111"
                  stroke="#d4af37"
                  strokeWidth="3"
                />

                {data.length <= 14 && (
                  <text
                    x={point.x}
                    y={chartHeight + 28}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="12"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/30">
        <span>
          Lowest:{" "}
          {money(Math.min(...data.map((item) => Number(item.revenue || 0))))}
        </span>

        <span>Highest: {money(maxRevenue)}</span>
      </div>
    </div>
  );
}

function PaymentMethodCard({ method }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
            <CreditCard size={18} />
          </div>

          <div>
            <p className="font-medium text-white">
              {formatMethod(method.method)}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {method.transactions} transaction
              {method.transactions !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <p className="font-semibold text-[#d4af37]">{money(method.revenue)}</p>
      </div>
    </div>
  );
}

export default function RevenueAnalyticsPage() {
  const [range, setRange] = useState("7d");

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async (selectedRange = range, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
       * CURRENT BACKEND:
       *
       * /api/admin/analytics/revenue
       *
       * Supported ranges:
       * today
       * 7d
       * 30d
       * month
       * year
       */

      const response = await fetch(
        `/api/admin/analytics/revenue?range=${encodeURIComponent(
          selectedRange,
        )}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load analytics.");
      }

      /*
       * CURRENT BACKEND RESPONSE:
       *
       * result.data.summary
       * result.data.chartData
       * result.data.paymentMethods
       */

      const backendData = result.data || {};

      const backendSummary = backendData.summary || {};

      const backendChart = Array.isArray(backendData.chartData)
        ? backendData.chartData
        : [];

      const backendPaymentMethods = Array.isArray(backendData.paymentMethods)
        ? backendData.paymentMethods
        : [];

      /*
       * Chart data already comes from backend
       * in the correct structure.
       */

      const normalizedChart = backendChart.map((item) => ({
        ...item,
        label: item.label || formatChartDate(item.date),
        revenue: Number(item.revenue || 0),
        transactions: Number(item.transactions || 0),
      }));

      /*
       * Payment methods already use:
       *
       * method
       * revenue
       * transactions
       */

      const normalizedPaymentMethods = backendPaymentMethods.map((item) => ({
        ...item,
        transactions: Number(item.transactions || 0),
        revenue: Number(item.revenue || 0),
      }));

      setData({
        range: backendData.range || selectedRange,

        summary: {
          totalRevenue: Number(backendSummary.totalRevenue || 0),

          paidTransactions: Number(backendSummary.paidTransactions || 0),

          averageOrderValue: Number(backendSummary.averageOrderValue || 0),

          todayRevenue: Number(backendSummary.todayRevenue || 0),

          todayTransactions: Number(backendSummary.todayTransactions || 0),

          monthRevenue: Number(backendSummary.monthRevenue || 0),

          yearRevenue: Number(backendSummary.yearRevenue || 0),
        },

        chartData: normalizedChart,

        paymentMethods: normalizedPaymentMethods,
      });
    } catch (error) {
      console.error("ANALYTICS FETCH ERROR:", error);

      await Swal.fire({
        icon: "error",
        title: "Analytics Error",
        text: error?.message || "Unable to load revenue analytics.",
        confirmButtonColor: "#d4af37",
        background: "#111111",
        color: "#f5f1e8",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics(range);
  }, [range]);

  const summary = data?.summary;

  const chartData = data?.chartData || [];

  const paymentMethods = data?.paymentMethods || [];

  const highestRevenueDay = useMemo(() => {
    if (!chartData.length) {
      return null;
    }

    return chartData.reduce(
      (highest, current) =>
        Number(current.revenue) > Number(highest.revenue) ? current : highest,
      chartData[0],
    );
  }, [chartData]);

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f5f1e8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* =====================================
            TOP NAVIGATION
        ====================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Home
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            Payments
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[#d4af37]">
              <BarChart3 size={14} />
              Business Intelligence
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Revenue Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/45">
              Track real paid revenue, transactions and payment performance
              across ST Restaurant.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics(range, true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            Refresh
          </button>
        </div>

        {/* =====================================
            RANGE SELECTOR
        ====================================== */}

        <div className="mb-8 flex flex-wrap gap-2">
          {ranges.map((item) => {
            const active = range === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setRange(item.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/10"
                    : "border border-white/10 bg-white/[0.03] text-white/55 hover:border-[#d4af37]/30 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* =====================================
            LOADING
        ====================================== */}

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.035]"
                />
              ))}
            </div>

            <div className="h-[430px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />
          </div>
        ) : (
          <>
            {/* =================================
                STATS
            ================================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={DollarSign}
                title="Selected Revenue"
                value={money(summary?.totalRevenue)}
                subtitle="Paid payments only"
              />

              <StatCard
                icon={WalletCards}
                title="Transactions"
                value={summary?.paidTransactions || 0}
                subtitle="Successful payments"
              />

              <StatCard
                icon={TrendingUp}
                title="Average Order"
                value={money(summary?.averageOrderValue)}
                subtitle="Revenue per payment"
              />

              <StatCard
                icon={CalendarDays}
                title="Today"
                value={money(summary?.todayRevenue)}
                subtitle={`${summary?.todayTransactions || 0} paid transaction${
                  Number(summary?.todayTransactions || 0) !== 1 ? "s" : ""
                }`}
              />
            </div>

            {/* =================================
                CHART
            ================================== */}

            <div className="mt-6">
              <RevenueChart data={chartData} />
            </div>

            {/* =================================
                SECONDARY ANALYTICS
            ================================== */}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* MONTH */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                      This Month
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-white">
                      {money(summary?.monthRevenue)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* BEST */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <TrendingUp size={20} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                      Best Period
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-white">
                      {highestRevenueDay
                        ? money(highestRevenueDay.revenue)
                        : "৳0.00"}
                    </h3>

                    {highestRevenueDay && (
                      <p className="mt-1 text-xs text-white/35">
                        {highestRevenueDay.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RANGE */}

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <BarChart3 size={20} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                      Active Range
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-white">
                      {ranges.find((item) => item.value === range)?.label}
                    </h3>

                    <p className="mt-1 text-xs text-white/35">Live analytics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================
                PAYMENT METHODS
            ================================== */}

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Payment Methods
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Revenue contribution by payment method
                </p>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                  <CreditCard size={30} className="mx-auto text-white/20" />

                  <p className="mt-3 text-sm text-white/35">
                    No paid transactions in this period.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard key={method.method} method={method} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

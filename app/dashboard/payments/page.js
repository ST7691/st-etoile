
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Home,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

export default function PaymentsDashboard() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);

  const [stats, setStats] = useState({
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    cancelledPayments: 0,
    totalRevenue: 0,
  });

  const [methodStats, setMethodStats] = useState([]);
  const [statusStats, setStatusStats] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  async function loadPayments(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (method !== "ALL") {
        params.set("method", method);
      }

      const response = await fetch(
        `/api/admin/payments?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        router.replace("/login?callbackUrl=/dashboard/payments");
        return;
      }

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load payments.",
        );
      }

      setPayments(result.data?.payments || []);
      setStats(result.data?.stats || {});
      setMethodStats(result.data?.methodStats || []);
      setStatusStats(result.data?.statusStats || []);
    } catch (error) {
      console.error("PAYMENTS DASHBOARD ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to Load Payments",
        text: error?.message || "Something went wrong.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPayments(true);
  }, [status, method]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPayments(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  /* ============================================================
     ACCESS DENIED
  ============================================================ */

  if (accessDenied) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-10 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />

            <h1 className="mt-5 text-2xl font-bold text-white">
              Access Denied
            </h1>

            <p className="mt-2 text-sm text-white/40">
              You do not have permission to access payment management.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black"
            >
              <Home size={16} />
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            TOP NAV
        ================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={16} />
            Home
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2.5 text-sm text-[#d4af37]"
          >
            <BarChart3 size={16} />
            Dashboard
          </Link>

          <button
            type="button"
            onClick={() => loadPayments(false)}
            disabled={refreshing}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* =================================================
            HEADER
        ================================================== */}

        <section className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
            Finance
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#f5f1e8] md:text-4xl">
            Payment Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Monitor customer payments, transactions, payment
            methods and restaurant revenue.
          </p>
        </section>

        {/* =================================================
            STATS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Revenue"
            value={`৳${Number(
              stats.totalRevenue || 0,
            ).toLocaleString()}`}
            icon={DollarSign}
            description="Successful payments"
          />

          <StatCard
            title="Paid"
            value={stats.paidPayments || 0}
            icon={CheckCircle2}
            description="Completed payments"
          />

          <StatCard
            title="Pending"
            value={stats.pendingPayments || 0}
            icon={Clock3}
            description="Awaiting payment"
          />

          <StatCard
            title="Failed"
            value={stats.failedPayments || 0}
            icon={XCircle}
            description="Failed transactions"
          />

          <StatCard
            title="Total"
            value={stats.totalPayments || 0}
            icon={CreditCard}
            description="All payment records"
          />
        </div>

        {/* =================================================
            ANALYTICS
        ================================================== */}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* Methods */}

          <section className="luxury-glass rounded-3xl p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-[#d4af37]">
                Payment Methods
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Method Breakdown
              </h2>
            </div>

            <div className="space-y-4">
              {methodStats.length === 0 ? (
                <EmptyAnalytics />
              ) : (
                methodStats.map((item) => (
                  <AnalyticsRow
                    key={item.method}
                    label={formatMethod(item.method)}
                    count={item._count?._all || 0}
                    amount={item._sum?.amount || 0}
                  />
                ))
              )}
            </div>
          </section>

          {/* Status */}

          <section className="luxury-glass rounded-3xl p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-[#d4af37]">
                Payment Status
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Transaction Overview
              </h2>
            </div>

            <div className="space-y-4">
              {statusStats.length === 0 ? (
                <EmptyAnalytics />
              ) : (
                statusStats.map((item) => (
                  <AnalyticsRow
                    key={item.status}
                    label={item.status}
                    count={item._count?._all || 0}
                    amount={item._sum?.amount || 0}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section className="mt-8 luxury-glass rounded-3xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row">

            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, transaction, customer..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d4af37]/30"
              />
            </div>

            {/* Status */}

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/70 outline-none focus:border-[#d4af37]/30"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Method */}

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/70 outline-none focus:border-[#d4af37]/30"
            >
              <option value="ALL">All Methods</option>
              <option value="COD">Cash on Delivery</option>
              <option value="SSLCOMMERZ">SSLCommerz</option>
              <option value="STRIPE">Stripe</option>
            </select>
          </div>
        </section>

        {/* =================================================
            PAYMENTS
        ================================================== */}

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#d4af37]">
                Transactions
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Recent Payments
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/40">
              {payments.length} results
            </span>
          </div>

          {loading ? (
            <PaymentSkeleton />
          ) : payments.length === 0 ? (
            <EmptyPayments />
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="luxury-glass rounded-2xl p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/30">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10">
          <Icon className="h-5 w-5 text-[#d4af37]" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ANALYTICS ROW
============================================================ */

function AnalyticsRow({
  label,
  count,
  amount,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div>
        <p className="font-medium text-white/75">
          {label}
        </p>

        <p className="mt-1 text-xs text-white/30">
          {count} transaction
          {count === 1 ? "" : "s"}
        </p>
      </div>

      <p className="font-semibold text-[#d4af37]">
        ৳{Number(amount).toLocaleString()}
      </p>
    </div>
  );
}

/* ============================================================
   PAYMENT CARD
============================================================ */

function PaymentCard({ payment }) {
  const order = payment.order;

  return (
    <div className="luxury-glass rounded-3xl p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        {/* LEFT */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">

            <Link
              href={`/orders/${order.id}`}
              className="font-semibold text-[#d4af37] hover:underline"
            >
              {order.orderNumber}
            </Link>

            <PaymentStatusBadge
              status={payment.status}
            />

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/40">
              {formatMethod(payment.method)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/45">
            <span>
              Customer:{" "}
              <span className="text-white/70">
                {order.user?.name ||
                  "Unknown Customer"}
              </span>
            </span>

            <span>
              Email:{" "}
              <span className="text-white/70">
                {order.user?.email || "N/A"}
              </span>
            </span>
          </div>

          {payment.transactionId && (
            <div className="mt-3">
              <p className="text-xs text-white/25">
                Transaction ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-white/45">
                {payment.transactionId}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT */}

        <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">

          <p className="text-2xl font-bold text-[#d4af37]">
            ৳{Number(payment.amount).toLocaleString()}
          </p>

          <p className="text-xs text-white/30">
            {formatDate(payment.createdAt)}
          </p>

          {payment.paidAt && (
            <p className="text-xs text-emerald-400/70">
              Paid: {formatDate(payment.paidAt)}
            </p>
          )}

          {/* VIEW DETAILS */}

          <Link
            href={`/dashboard/payments/${payment.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 transition hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10 hover:text-[#d4af37]"
          >
            View Details

            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAYMENT STATUS
============================================================ */

function PaymentStatusBadge({ status }) {
  const config = {
    PAID: {
      icon: CheckCircle2,
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },

    PENDING: {
      icon: Clock3,
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },

    FAILED: {
      icon: XCircle,
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },

    CANCELLED: {
      icon: XCircle,
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },
  };

  const current =
    config[status] || config.PENDING;

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${current.className}`}
    >
      <Icon size={13} />

      {status}
    </span>
  );
}

/* ============================================================
   EMPTY PAYMENTS
============================================================ */

function EmptyPayments() {
  return (
    <div className="luxury-glass rounded-3xl p-12 text-center">
      <CreditCard className="mx-auto h-12 w-12 text-white/10" />

      <h3 className="mt-5 text-lg font-semibold text-white/70">
        No payments found
      </h3>

      <p className="mt-2 text-sm text-white/30">
        Try changing your search or filters.
      </p>
    </div>
  );
}

/* ============================================================
   EMPTY ANALYTICS
============================================================ */

function EmptyAnalytics() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-white/30">
      No payment data available.
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function PaymentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map(
        (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-3xl bg-white/5"
          />
        ),
      )}
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatMethod(method) {
  const methods = {
    COD: "Cash on Delivery",
    SSLCOMMERZ: "SSLCommerz",
    STRIPE: "Stripe",
  };

  return (
    methods[method] ||
    method ||
    "Unknown"
  );
}

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  try {
    return new Date(date).toLocaleString(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  } catch {
    return "N/A";
  }
}


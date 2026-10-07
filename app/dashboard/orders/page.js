"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"];

const ORDER_STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const DEFAULT_STATS = {
  total: 0,
  pending: 0,
  confirmed: 0,
  preparing: 0,
  outForDelivery: 0,
  delivered: 0,
  cancelled: 0,
  paid: 0,
  failed: 0,
  refunded: 0,
};

const ALLOWED_ROLES = ["ADMIN", "STAFF"];

function formatMoney(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatShortDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "CU";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getOrderStatusClass(status) {
  const classes = {
    PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    CONFIRMED: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    PREPARING: "border-purple-400/20 bg-purple-400/10 text-purple-300",
    OUT_FOR_DELIVERY: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    DELIVERED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    CANCELLED: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return classes[status] || "border-white/10 bg-white/5 text-gray-300";
}

function getPaymentStatusClass(status) {
  const classes = {
    PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    PAID: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    FAILED: "border-red-400/20 bg-red-400/10 text-red-300",
    REFUNDED: "border-purple-400/20 bg-purple-400/10 text-purple-300",
  };

  return classes[status] || "border-white/10 bg-white/5 text-gray-300";
}

function StatusBadge({ status, type = "order" }) {
  const safeStatus = status || "PENDING";

  const label =
    type === "payment"
      ? PAYMENT_STATUS_LABELS[safeStatus] || safeStatus
      : ORDER_STATUS_LABELS[safeStatus] || safeStatus;

  const className =
    type === "payment"
      ? getPaymentStatusClass(safeStatus)
      : getOrderStatusClass(safeStatus);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function StatCard({ label, value, icon, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/80 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">{label}</p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>

          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-lg text-amber-300">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const userRole = String(session?.user?.role || "")
    .trim()
    .toUpperCase();

  const isAdmin =
    sessionStatus === "authenticated" && ALLOWED_ROLES.includes(userRole);

  const isCustomer =
    sessionStatus === "authenticated" && userRole === "CUSTOMER";

  const parseResponse = async (response) => {
    const text = await response.text();

    if (!text || !text.trim()) {
      throw new Error(
        `Server returned an empty response (${response.status}).`,
      );
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("INVALID JSON RESPONSE:", text);

      throw new Error(`Server returned invalid JSON (${response.status}).`);
    }
  };

  /*
   * IMPORTANT:
   * CUSTOMER MUST NEVER CALL /api/admin/orders
   */
  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      if (!isAdmin) {
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (status !== "ALL") {
          params.set("status", status);
        }

        if (paymentStatus !== "ALL") {
          params.set("paymentStatus", paymentStatus);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const queryString = params.toString();

        const url = queryString
          ? `/api/admin/orders?${queryString}`
          : "/api/admin/orders";

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await parseResponse(response);

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || `Failed to load orders (${response.status}).`,
          );
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);

        setStats({
          ...DEFAULT_STATS,
          ...(data.stats || {}),
        });
      } catch (err) {
        console.error("ADMIN ORDERS GET ERROR:", err);

        setError(err?.message || "Failed to load orders.");

        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin, search, status, paymentStatus],
  );

  /*
   * AUTHORIZATION GUARD
   */
  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (sessionStatus === "authenticated") {
      if (isCustomer) {
        router.replace("/orders");
        return;
      }

      if (!isAdmin) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [sessionStatus, isCustomer, isAdmin, router]);

  /*
   * FETCH ONLY FOR ADMIN / STAFF
   */
  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      return;
    }

    if (!isAdmin) {
      return;
    }

    const timer = setTimeout(() => {
      fetchOrders(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [sessionStatus, isAdmin, fetchOrders]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  async function updateOrderStatus(orderId, newStatus) {
    try {
      setUpdatingOrderId(orderId);
      setError("");

      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          orderStatus: newStatus,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || `Failed to update order (${response.status}).`,
        );
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order,
        ),
      );

      setSelectedOrder((current) =>
        current?.id === orderId
          ? {
              ...current,
              status: newStatus,
            }
          : current,
      );

      setNotice(
        `Order status changed to ${
          ORDER_STATUS_LABELS[newStatus] || newStatus
        }.`,
      );

      await fetchOrders(true);
    } catch (err) {
      console.error("UPDATE ORDER STATUS ERROR:", err);

      setError(err?.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function updatePaymentStatus(orderId, newStatus) {
    try {
      setUpdatingPaymentId(orderId);
      setError("");

      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          paymentStatus: newStatus,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || `Failed to update payment (${response.status}).`,
        );
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                payment: order.payment
                  ? {
                      ...order.payment,
                      status: newStatus,
                    }
                  : {
                      status: newStatus,
                      method: order.paymentMethod || "UNKNOWN",
                      amount: order.total,
                    },
              }
            : order,
        ),
      );

      setSelectedOrder((current) =>
        current?.id === orderId
          ? {
              ...current,
              payment: current.payment
                ? {
                    ...current.payment,
                    status: newStatus,
                  }
                : {
                    status: newStatus,
                    method: current.paymentMethod || "UNKNOWN",
                    amount: current.total,
                  },
            }
          : current,
      );

      setNotice(
        `Payment status changed to ${
          PAYMENT_STATUS_LABELS[newStatus] || newStatus
        }.`,
      );

      await fetchOrders(true);
    } catch (err) {
      console.error("UPDATE PAYMENT STATUS ERROR:", err);

      setError(err?.message || "Failed to update payment status.");
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setPaymentStatus("ALL");
  }

  /*
   * AUTH LOADING
   */
  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />

          <p className="mt-4 text-sm text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  /*
   * UNAUTHORIZED / REDIRECTING
   */
  if (sessionStatus === "unauthenticated" || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-2xl text-amber-300">
            🔒
          </div>

          <h2 className="mt-5 text-xl font-bold">Redirecting...</h2>

          <p className="mt-2 text-sm text-gray-500">
            You do not have access to this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
              <span className="text-amber-400">Admin</span>

              <span className="text-gray-700">/</span>

              <span className="text-gray-500">Orders</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Orders Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Manage customer orders, delivery progress and payment status from
              one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:border-amber-400/40 hover:bg-amber-400/15"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* NOTICE */}
        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            ✓ {notice}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-300">
                  Unable to load orders
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300/70">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchOrders(true)}
                className="w-fit rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/20"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Orders"
            value={stats.total}
            icon="◉"
            description="All customer orders"
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon="◷"
            description="Waiting for confirmation"
          />

          <StatCard
            label="Preparing"
            value={stats.preparing}
            icon="♨"
            description="Kitchen in progress"
          />

          <StatCard
            label="Delivered"
            value={stats.delivered}
            icon="✓"
            description="Successfully delivered"
          />

          <StatCard
            label="Paid"
            value={stats.paid}
            icon="৳"
            description="Successful payments"
          />
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#111111]/80 p-4 shadow-xl shadow-black/10">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_220px_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order number or customer..."
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-amber-400/40"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200 outline-none focus:border-amber-400/40"
            >
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item} className="bg-[#111111]">
                  {item === "ALL"
                    ? "All Order Status"
                    : ORDER_STATUS_LABELS[item] || item}
                </option>
              ))}
            </select>

            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-200 outline-none focus:border-amber-400/40"
            >
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item} className="bg-[#111111]">
                  {item === "ALL"
                    ? "All Payment Status"
                    : PAYMENT_STATUS_LABELS[item] || item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-amber-400/20 hover:bg-amber-400/10 hover:text-amber-300"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-300">
                {orders.length}
              </span>{" "}
              order
              {orders.length === 1 ? "" : "s"}
            </p>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>
                Paid: <b className="text-emerald-300">{stats.paid}</b>
              </span>

              <span>
                Failed: <b className="text-red-300">{stats.failed}</b>
              </span>

              <span>
                Refunded: <b className="text-purple-300">{stats.refunded}</b>
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#111111]/80 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />

              <p className="mt-4 text-sm text-gray-400">Loading orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111111]/80 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-2xl text-amber-300">
              ◉
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              No orders found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              No orders match your current search or filter settings.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/15"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/80 shadow-xl shadow-black/10 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Items
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Total
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Order Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="text-left"
                          >
                            <p className="font-semibold text-amber-300 hover:text-amber-200">
                              #{order.orderNumber}
                            </p>

                            <p className="mt-1 text-xs text-gray-600">
                              {order.id?.slice(-8)}
                            </p>
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {order.user?.image ? (
                              <img
                                src={order.user.image}
                                alt={order.user?.name || "Customer"}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 text-xs font-bold text-amber-300">
                                {getInitials(order.user?.name)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate font-medium text-gray-200">
                                {order.user?.name || "Customer"}
                              </p>

                              <p className="max-w-[180px] truncate text-xs text-gray-500">
                                {order.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-200">
                            {order.items?.length || 0} item
                            {order.items?.length === 1 ? "" : "s"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                            {(order.items || [])
                              .map(
                                (item) =>
                                  `${item.quantity}× ${
                                    item.menuItem?.name || "Item"
                                  }`,
                              )
                              .join(", ")}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-white">
                            {formatMoney(order.total)}
                          </p>

                          <p className="mt-1 text-xs capitalize text-gray-600">
                            {order.payment?.method ||
                              order.paymentMethod ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={order.status || "PENDING"}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) =>
                              updateOrderStatus(order.id, event.target.value)
                            }
                            className={`rounded-full border bg-[#111111] px-3 py-1.5 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${getOrderStatusClass(
                              order.status,
                            )}`}
                          >
                            {ORDER_STATUSES.filter(
                              (item) => item !== "ALL",
                            ).map((item) => (
                              <option
                                key={item}
                                value={item}
                                className="bg-[#111111] text-white"
                              >
                                {ORDER_STATUS_LABELS[item]}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={order.payment?.status || "PENDING"}
                            disabled={updatingPaymentId === order.id}
                            onChange={(event) =>
                              updatePaymentStatus(order.id, event.target.value)
                            }
                            className={`rounded-full border bg-[#111111] px-3 py-1.5 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${getPaymentStatusClass(
                              order.payment?.status || "PENDING",
                            )}`}
                          >
                            {PAYMENT_STATUSES.filter(
                              (item) => item !== "ALL",
                            ).map((item) => (
                              <option
                                key={item}
                                value={item}
                                className="bg-[#111111] text-white"
                              >
                                {PAYMENT_STATUS_LABELS[item]}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-300">
                            {formatShortDate(order.createdAt)}
                          </p>

                          <p className="mt-1 text-xs text-gray-600">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleTimeString(
                                  "en-BD",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-amber-400/20 hover:bg-amber-400/10 hover:text-amber-300"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}
            <div className="grid gap-4 lg:hidden">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4 shadow-xl shadow-black/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="font-bold text-amber-300"
                      >
                        #{order.orderNumber}
                      </button>

                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <StatusBadge status={order.status} />
                  </div>

                  <div className="my-4 h-px bg-white/5" />

                  <div className="flex items-center gap-3">
                    {order.user?.image ? (
                      <img
                        src={order.user.image}
                        alt={order.user?.name || "Customer"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-xs font-bold text-amber-300">
                        {getInitials(order.user?.name)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-200">
                        {order.user?.name || "Customer"}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {order.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-gray-600">Items</p>

                      <p className="mt-1 font-semibold text-gray-200">
                        {order.items?.length || 0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-xs text-gray-600">Total</p>

                      <p className="mt-1 font-bold text-amber-300">
                        {formatMoney(order.total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs text-gray-500">Payment</p>

                    <StatusBadge
                      status={order.payment?.status || "PENDING"}
                      type="payment"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs text-gray-500">
                      Order Status
                    </label>

                    <select
                      value={order.status || "PENDING"}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-gray-200 outline-none focus:border-amber-400/30 disabled:opacity-50"
                    >
                      {ORDER_STATUSES.filter((item) => item !== "ALL").map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                            className="bg-[#111111]"
                          >
                            {ORDER_STATUS_LABELS[item]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="mt-4 w-full rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/15"
                  >
                    View Order Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#101010] shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                  Order Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  #{selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(95vh-80px)] overflow-y-auto p-5 sm:p-6">
              {/* STATUS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                    Order Status
                  </p>

                  <select
                    value={selectedOrder.status || "PENDING"}
                    disabled={updatingOrderId === selectedOrder.id}
                    onChange={(event) =>
                      updateOrderStatus(selectedOrder.id, event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-sm text-gray-200 outline-none focus:border-amber-400/30 disabled:opacity-50"
                  >
                    {ORDER_STATUSES.filter((item) => item !== "ALL").map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#111111]"
                        >
                          {ORDER_STATUS_LABELS[item]}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-600">
                    Payment Status
                  </p>

                  <select
                    value={selectedOrder.payment?.status || "PENDING"}
                    disabled={updatingPaymentId === selectedOrder.id}
                    onChange={(event) =>
                      updatePaymentStatus(selectedOrder.id, event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-sm text-gray-200 outline-none focus:border-amber-400/30 disabled:opacity-50"
                  >
                    {PAYMENT_STATUSES.filter((item) => item !== "ALL").map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#111111]"
                        >
                          {PAYMENT_STATUS_LABELS[item]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* CUSTOMER */}
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Customer
                </h3>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    {selectedOrder.user?.image ? (
                      <img
                        src={selectedOrder.user.image}
                        alt={selectedOrder.user?.name || "Customer"}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 font-bold text-amber-300">
                        {getInitials(selectedOrder.user?.name)}
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-200">
                        {selectedOrder.user?.name || "Customer"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {selectedOrder.user?.email || "No email"}
                      </p>

                      {selectedOrder.user?.phone && (
                        <p className="mt-1 text-xs text-gray-600">
                          {selectedOrder.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ITEMS */}
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Ordered Items
                  </h3>

                  <span className="text-xs text-gray-500">
                    {selectedOrder.items?.length || 0} item
                    {selectedOrder.items?.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {(selectedOrder.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-b border-white/5 p-4 last:border-b-0"
                    >
                      {item.menuItem?.image ? (
                        <img
                          src={item.menuItem.image}
                          alt={item.menuItem?.name || "Food"}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-xl">
                          🍽️
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-200">
                          {item.menuItem?.name || "Menu Item"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Qty: {item.quantity} × {formatMoney(item.price)}
                        </p>
                      </div>

                      <p className="font-semibold text-white">
                        {formatMoney(
                          Number(item.price || 0) * Number(item.quantity || 0),
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* DELIVERY */}
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Delivery Address
                </h3>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  {selectedOrder.deliveryAddress ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-gray-200">
                        {selectedOrder.deliveryAddress.fullName}
                      </p>

                      <p className="text-gray-400">
                        {selectedOrder.deliveryAddress.phone}
                      </p>

                      <p className="leading-6 text-gray-400">
                        {selectedOrder.deliveryAddress.address}
                        <br />

                        {selectedOrder.deliveryAddress.area && (
                          <>{selectedOrder.deliveryAddress.area}, </>
                        )}

                        {selectedOrder.deliveryAddress.city}

                        {selectedOrder.deliveryAddress.postalCode &&
                          ` - ${selectedOrder.deliveryAddress.postalCode}`}
                      </p>

                      {selectedOrder.deliveryAddress.instructions && (
                        <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/5 p-3">
                          <p className="text-xs font-semibold text-amber-300">
                            Delivery Note
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-400">
                            {selectedOrder.deliveryAddress.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No delivery address available.
                    </p>
                  )}
                </div>
              </section>

              {/* PAYMENT */}
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Payment
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-600">Method</p>

                    <p className="mt-1 text-sm font-semibold text-gray-200">
                      {selectedOrder.payment?.method ||
                        selectedOrder.paymentMethod ||
                        "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-600">Status</p>

                    <div className="mt-2">
                      <StatusBadge
                        status={selectedOrder.payment?.status || "PENDING"}
                        type="payment"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-600">Amount</p>

                    <p className="mt-1 text-sm font-bold text-amber-300">
                      {formatMoney(
                        selectedOrder.payment?.amount || selectedOrder.total,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-600">Paid At</p>

                    <p className="mt-1 text-xs font-semibold text-gray-300">
                      {selectedOrder.payment?.paidAt
                        ? formatShortDate(selectedOrder.payment.paidAt)
                        : "—"}
                    </p>
                  </div>
                </div>

                {selectedOrder.payment?.transactionId && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-gray-600">Transaction ID</p>

                    <p className="mt-1 break-all font-mono text-xs text-gray-400">
                      {selectedOrder.payment.transactionId}
                    </p>
                  </div>
                )}
              </section>

              {/* SUMMARY */}
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Order Summary
                </h3>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>

                      <span>{formatMoney(selectedOrder.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Fee</span>

                      <span>{formatMoney(selectedOrder.deliveryFee)}</span>
                    </div>

                    <div className="flex justify-between text-gray-400">
                      <span>Discount</span>

                      <span className="text-emerald-300">
                        -{formatMoney(selectedOrder.discount)}
                      </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex justify-between text-base font-bold">
                      <span className="text-white">Total</span>

                      <span className="text-amber-300">
                        {formatMoney(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* NOTES */}
              {selectedOrder.notes && (
                <section className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    Customer Note
                  </h3>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-gray-400">
                    {selectedOrder.notes}
                  </div>
                </section>
              )}

              {/* FOOTER */}
              <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-6 text-gray-600">
                Created: {formatDate(selectedOrder.createdAt)}
                <br />
                Last updated: {formatDate(selectedOrder.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

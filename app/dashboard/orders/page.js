"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const statusStyles = {
  PENDING: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",

  CONFIRMED: "border-blue-500/20 bg-blue-500/10 text-blue-400",

  PREPARING: "border-purple-500/20 bg-purple-500/10 text-purple-400",

  OUT_FOR_DELIVERY: "border-orange-500/20 bg-orange-500/10 text-orange-400",

  DELIVERED: "border-green-500/20 bg-green-500/10 text-green-400",

  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-400",
};

const statusLabels = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadOrders(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login?callbackUrl=/dashboard/orders";
        return;
      }

      if (response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Access denied",
          text: "You do not have permission to access this page.",
          background: "#111",
          color: "#f5f1e8",
          confirmButtonColor: "#d4af37",
        });

        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load orders.");
      }

      setOrders(result.data || []);
    } catch (error) {
      console.error("ADMIN ORDER LOAD ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load orders",
        text: error.message || "Please try again.",
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
    loadOrders();
  }, []);

  async function updateStatus(orderId, status) {
    const previousOrders = [...orders];

    // Optimistic UI
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );

    setUpdatingId(orderId);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update status.");
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Order status updated",
        showConfirmButton: false,
        timer: 1800,
        background: "#111",
        color: "#f5f1e8",
      });
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      // Rollback optimistic UI
      setOrders(previousOrders);

      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.message || "Please try again.",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return (
        order.orderNumber?.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query) ||
        order.deliveryAddress?.fullName?.toLowerCase().includes(query) ||
        order.deliveryAddress?.phone?.toLowerCase().includes(query)
      );
    });
  }, [orders, search, statusFilter]);

  const statistics = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter((order) => order.status === "PENDING").length;

    const preparing = orders.filter(
      (order) => order.status === "PREPARING",
    ).length;

    const delivery = orders.filter(
      (order) => order.status === "OUT_FOR_DELIVERY",
    ).length;

    const delivered = orders.filter(
      (order) => order.status === "DELIVERED",
    ).length;

    const revenue = orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + Number(order.total), 0);

    return {
      total,
      pending,
      preparing,
      delivery,
      delivered,
      revenue,
    };
  }, [orders]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="h-10 w-64 animate-pulse rounded bg-white/5" />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-3xl bg-white/5"
              />
            ))}
          </div>

          <div className="mt-8 h-[500px] animate-pulse rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-[#d4af37]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>

            <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
              Admin Panel
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[#f5f1e8]">
              Order Management
            </h1>

            <p className="mt-2 text-white/40">
              Manage customer orders and delivery status.
            </p>
          </div>

          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<ShoppingBag />}
            label="Total Orders"
            value={statistics.total}
          />

          <StatCard
            icon={<Clock3 />}
            label="Pending"
            value={statistics.pending}
          />

          <StatCard
            icon={<Package />}
            label="Preparing"
            value={statistics.preparing}
          />

          <StatCard
            icon={<Truck />}
            label="Delivery"
            value={statistics.delivery}
          />

          <StatCard
            icon={<CheckCircle2 />}
            label="Delivered"
            value={statistics.delivered}
          />
        </div>

        {/* Revenue */}
        <div className="mt-4 rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-6">
          <p className="text-xs uppercase tracking-wider text-white/35">
            Current Order Revenue
          </p>

          <p className="mt-2 text-3xl font-bold text-[#d4af37]">
            ৳{statistics.revenue.toLocaleString()}
          </p>
        </div>

        {/* Filters */}
        <div className="luxury-glass mt-8 rounded-3xl p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order number, customer, phone..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d4af37]/50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/70 outline-none focus:border-[#d4af37]/50"
            >
              <option value="ALL">All Status</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders */}
        <div className="mt-5 space-y-4">
          {!filteredOrders.length ? (
            <div className="luxury-glass rounded-3xl py-20 text-center">
              <ShoppingBag className="mx-auto h-14 w-14 text-white/15" />

              <h2 className="mt-5 text-xl font-semibold text-white/60">
                No orders found
              </h2>

              <p className="mt-2 text-sm text-white/30">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                updating={updatingId === order.id}
                onStatusChange={updateStatus}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function AdminOrderCard({ order, updating, onStatusChange }) {
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const customerName =
    order.deliveryAddress?.fullName || order.user?.name || "Guest Customer";

  const phone = order.deliveryAddress?.phone || order.user?.phone || "No phone";

  return (
    <article className="luxury-glass overflow-hidden rounded-3xl">
      <div className="p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px_240px] lg:items-center">
          {/* Customer / Order */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold tracking-wide text-[#d4af37]">
                {order.orderNumber}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  statusStyles[order.status]
                }`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
                <User className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-medium text-white/80">
                  {customerName}
                </p>

                <p className="truncate text-xs text-white/35">{phone}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-white/40">
              {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-BD")}
            </p>

            <p className="mt-2 line-clamp-1 text-xs text-white/30">
              {order.items
                .map((item) => `${item.menuItem.name} ×${item.quantity}`)
                .join(", ")}
            </p>
          </div>

          {/* Total */}
          <div className="lg:text-right">
            <p className="text-xs uppercase tracking-wider text-white/25">
              Payment
            </p>

            <p className="mt-1 text-sm text-white/60">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </p>

            <p className="mt-4 text-xs uppercase tracking-wider text-white/25">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-[#f5f1e8]">
              ৳{Number(order.total).toLocaleString()}
            </p>
          </div>

          {/* Status Control */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-white/30">
              Update Status
            </label>

            <div className="relative">
              <select
                value={order.status}
                disabled={updating}
                onChange={(event) =>
                  onStatusChange(order.id, event.target.value)
                }
                className="w-full appearance-none rounded-2xl border border-white/10 bg-[#111] px-4 py-3 pr-10 text-sm text-white/80 outline-none transition focus:border-[#d4af37]/50 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              {updating ? (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#d4af37]" />
              ) : (
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              )}
            </div>

            <Link
              href={`/orders/${order.id}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-white/50 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
            >
              <Eye className="h-4 w-4" />
              View Order
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-white/[0.015] px-5 py-3 md:px-6">
        <p className="text-xs text-white/25">
          Delivery:{" "}
          <span className="text-white/45">
            {order.deliveryAddress?.address}, {order.deliveryAddress?.city}
          </span>
        </p>
      </div>
    </article>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="luxury-glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
          {icon}
        </div>

        <span className="text-2xl font-bold text-[#f5f1e8]">{value}</span>
      </div>

      <p className="mt-4 text-sm text-white/40">{label}</p>
    </div>
  );
}

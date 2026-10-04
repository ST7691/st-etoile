"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

const statusConfig = {
  PENDING: {
    label: "Order Placed",
    icon: Clock3,
  },

  CONFIRMED: {
    label: "Confirmed",
    icon: Package,
  },

  PREPARING: {
    label: "Preparing",
    icon: Package,
  },

  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
  },

  DELIVERED: {
    label: "Delivered",
    icon: ShoppingBag,
  },

  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href = "/login?callbackUrl=/orders";
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load orders.");
        }

        if (active) {
          setOrders(result.data || []);
        }
      } catch (error) {
        console.error("ORDERS LOAD ERROR:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="h-10 w-52 animate-pulse rounded bg-white/5" />

          <div className="mt-3 h-5 w-80 animate-pulse rounded bg-white/5" />

          <div className="mt-10 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-3xl bg-white/5"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d4af37]">
            ST Restaurant
          </p>

          <h1 className="mt-2 text-4xl font-semibold text-[#f5f1e8] md:text-5xl">
            My Orders
          </h1>

          <p className="mt-3 text-white/45">
            Track your recent restaurant orders.
          </p>
        </div>

        {/* Empty */}
        {!orders.length ? (
          <div className="luxury-glass rounded-3xl px-6 py-20 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-[#d4af37]" />

            <h2 className="mt-6 text-2xl font-semibold text-[#f5f1e8]">
              No orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-white/40">
              Your delicious journey starts with your first order.
            </p>

            <Link
              href="/menu"
              className="gold-button mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold"
            >
              Explore Menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order }) {
  const status = statusConfig[order.status] || statusConfig.PENDING;

  const StatusIcon = status.icon;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <article className="luxury-glass overflow-hidden rounded-3xl transition duration-300 hover:border-[#d4af37]/30">
      {/* Top */}
      <div className="flex flex-col gap-5 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold tracking-wide text-[#d4af37]">
              {order.orderNumber}
            </span>

            <span className="rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-xs font-medium text-[#d4af37]">
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formattedDate}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {formattedTime}
            </span>
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-xs uppercase tracking-wider text-white/30">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold text-[#f5f1e8]">
            ৳{Number(order.total).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Items */}
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex -space-x-3">
              {order.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#111] bg-[#181818]"
                >
                  {item.menuItem.image ? (
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-white/30" />
                  )}
                </div>
              ))}
            </div>

            <div className="ml-5 min-w-0">
              <p className="text-sm font-medium text-[#f5f1e8]">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>

              <p className="mt-1 truncate text-xs text-white/35">
                {order.items.map((item) => item.menuItem.name).join(", ")}
              </p>
            </div>
          </div>

          {/* Payment + Button */}
          <div className="flex items-center justify-between gap-5 md:justify-end">
            <div>
              <p className="text-xs text-white/30">Payment</p>

              <p className="mt-1 text-sm font-medium text-white/70">
                {order.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : order.paymentMethod}
              </p>
            </div>

            <Link
              href={`/orders/${order.id}`}
              className="group flex h-11 items-center gap-2 rounded-full border border-[#d4af37]/30 px-5 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
            >
              Details
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="border-t border-white/5 bg-white/[0.015] px-5 py-4 md:px-6">
        <div className="flex items-center gap-2 text-xs text-white/35">
          <StatusIcon className="h-4 w-4 text-[#d4af37]" />

          <span>Current status:</span>

          <span className="font-medium text-white/70">{status.label}</span>
        </div>
      </div>
    </article>
  );
}

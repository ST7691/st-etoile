"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShoppingBag,
  UserPlus,
  XCircle,
} from "lucide-react";

function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusIcon({ status }) {
  if (status === "CONFIRMED") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }

  if (status === "CANCELLED") {
    return <XCircle className="h-4 w-4 text-red-400" />;
  }

  return <Clock3 className="h-4 w-4 text-[#d4af37]" />;
}

export default function RecentActivity({
  orders = [],
  reservations = [],
  loading = false,
}) {
  const activities = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: "order",
      title: `New order ${order.orderNumber}`,
      description: `${
        order.user?.name || "Customer"
      } placed an order worth BDT ${Number(order.total || 0).toLocaleString()}`,
      date: order.createdAt,
      status: order.status,
    })),

    ...reservations.map((reservation) => ({
      id: `reservation-${reservation.id}`,
      type: "reservation",
      title: "Table reservation",
      description: `${reservation.name} booked a table for ${
        reservation.guests
      } guests`,
      date: reservation.createdAt,
      status: reservation.status,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b1014] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Recent Activity</h2>

          <p className="mt-1 text-xs text-white/35">
            Latest restaurant activity
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1 text-xs font-medium text-[#d4af37]"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 space-y-1">
        {loading ? (
          Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-3 rounded-xl p-3"
            >
              <div className="h-10 w-10 rounded-full bg-white/5" />

              <div className="flex-1">
                <div className="h-3 w-40 rounded bg-white/5" />

                <div className="mt-2 h-2 w-28 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/30">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10">
                {activity.type === "order" ? (
                  <ShoppingBag className="h-4 w-4 text-[#d4af37]" />
                ) : (
                  <CalendarDays className="h-4 w-4 text-[#d4af37]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {activity.title}
                </p>

                <p className="mt-1 truncate text-xs text-white/35">
                  {activity.description}
                </p>

                <p className="mt-1 text-[10px] text-white/20">
                  {formatTime(activity.date)}
                </p>
              </div>

              <StatusIcon status={activity.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

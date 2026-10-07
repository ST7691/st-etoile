"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  CreditCard,
  MessageSquare,
  Package,
  RefreshCw,
  CalendarDays,
  Search,
  AlertCircle,
} from "lucide-react";

const TYPE_CONFIG = {
  ORDER: {
    label: "Order",
    icon: Package,
  },
  PAYMENT: {
    label: "Payment",
    icon: CreditCard,
  },
  RESERVATION: {
    label: "Reservation",
    icon: CalendarDays,
  },
  REVIEW: {
    label: "Review",
    icon: MessageSquare,
  },
};

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "ORDER", label: "Orders" },
  { value: "PAYMENT", label: "Payments" },
  { value: "RESERVATION", label: "Reservations" },
  { value: "REVIEW", label: "Reviews" },
];

export default function NotificationsPage() {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH USER NOTIFICATIONS
  // ==========================================

  async function fetchNotifications(showRefresh = false) {
    // Never fetch notifications before authentication is ready
    if (sessionStatus !== "authenticated") {
      return;
    }

    // Must have logged-in user
    if (!session?.user?.id) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load notifications.");
      }

      const userNotifications = Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setNotifications(userNotifications);

      setUnreadCount(
        Number(
          data?.unreadCount ??
            userNotifications.filter((notification) => !notification.isRead)
              .length,
        ),
      );
    } catch (err) {
      console.error("NOTIFICATIONS PAGE ERROR:", err);

      setError(
        err?.message || "Something went wrong while loading notifications.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ==========================================
  // AUTH + AUTO REFRESH
  // ==========================================

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (sessionStatus === "authenticated" && !session?.user?.id) {
      router.replace("/login");
      return;
    }

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [sessionStatus, session?.user?.id]);

  // ==========================================
  // MARK SINGLE NOTIFICATION READ
  // ==========================================

  async function markAsRead(id) {
    if (!id || !session?.user?.id) {
      return;
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        console.error("MARK READ FAILED:", res.status, data);
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("MARK READ ERROR:", error);
    }
  }

  // ==========================================
  // MARK ALL READ
  // ==========================================

  async function markAllAsRead() {
    if (!session?.user?.id || unreadCount === 0) {
      return;
    }

    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        console.error("MARK ALL READ FAILED:", res.status, data);
        return;
      }

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL READ ERROR:", error);
    }
  }

  // ==========================================
  // FILTER + SEARCH
  // ==========================================

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (filter === "UNREAD") {
      result = result.filter((notification) => !notification.isRead);
    } else if (filter !== "ALL") {
      result = result.filter(
        (notification) =>
          String(notification.type || "").toUpperCase() === filter,
      );
    }

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((notification) => {
        const title = String(notification.title || "").toLowerCase();

        const message = String(notification.message || "").toLowerCase();

        return title.includes(searchValue) || message.includes(searchValue);
      });
    }

    return result;
  }, [notifications, filter, search]);

  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (sessionStatus === "loading") {
    return (
      <main className="min-h-screen bg-[#070707] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <NotificationSkeleton />
        </div>
      </main>
    );
  }

  // ==========================================
  // REDIRECTING
  // ==========================================

  if (sessionStatus === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <Bell size={34} className="mx-auto mb-4 text-[#d4af37]" />

          <p className="text-sm text-gray-400">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* ==========================================
          HERO
      ========================================== */}

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2 text-[#d4af37]">
                <Bell size={20} />

                <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                  Notifications
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your Notifications
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                Stay updated with your orders, payments, reservations, reviews
                and other restaurant activities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Total
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {notifications.length}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[#d4af37]/70">
                  Unread
                </p>

                <p className="mt-1 text-xl font-bold text-[#d4af37]">
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* TOOLBAR */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#d4af37]/40"
              />
            </div>

            {/* Actions */}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-gray-300 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-3 text-xs font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            </div>
          </div>

          {/* FILTERS */}

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition ${
                  filter === item.value
                    ? "bg-[#d4af37] text-black"
                    : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#d4af37]/30 hover:text-[#d4af37]"
                }`}
              >
                {item.label}

                {item.value === "UNREAD" && unreadCount > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                      filter === item.value
                        ? "bg-black/20 text-black"
                        : "bg-[#d4af37]/15 text-[#d4af37]"
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ERROR */}

        {error && !loading && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-400" />

              <div>
                <p className="text-sm font-semibold text-red-300">
                  Unable to load notifications
                </p>

                <p className="mt-1 text-xs text-red-300/70">{error}</p>

                <button
                  type="button"
                  onClick={() => fetchNotifications()}
                  className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            hasFilter={filter !== "ALL" || search.trim().length > 0}
            onReset={() => {
              setFilter("ALL");
              setSearch("");
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   NOTIFICATION CARD
========================================================= */

function NotificationCard({ notification, onRead }) {
  const type = String(notification.type || "ORDER").toUpperCase();

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.ORDER;

  const Icon = config.icon;

  const isUnread = !notification.isRead;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition ${
        isUnread
          ? "border-[#d4af37]/25 bg-[#d4af37]/[0.045]"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {isUnread && (
        <span className="absolute left-0 top-0 h-full w-1 bg-[#d4af37]" />
      )}

      <div className="flex gap-4 p-4 sm:p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isUnread
              ? "bg-[#d4af37]/10 text-[#d4af37]"
              : "bg-white/[0.05] text-gray-500"
          }`}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm font-semibold ${
                    isUnread ? "text-white" : "text-gray-300"
                  }`}
                >
                  {notification.title || "Notification"}
                </h3>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-gray-500">
                  {config.label}
                </span>

                {isUnread && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {notification.message || ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-[11px] text-gray-600">
              <Clock size={12} />

              {formatDate(notification.createdAt)}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {notification.link && (
              <Link
                href={notification.link}
                onClick={() => {
                  if (isUnread) {
                    onRead(notification.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37]/10 px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20"
              >
                View details
                <ChevronRight size={14} />
              </Link>
            )}

            {isUnread && (
              <button
                type="button"
                onClick={() => onRead(notification.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
              >
                <Check size={14} />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ hasFilter, onReset }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5">
          {hasFilter ? (
            <Search size={27} className="text-[#d4af37]" />
          ) : (
            <Bell size={27} className="text-[#d4af37]" />
          )}
        </div>

        <h2 className="mt-5 text-xl font-semibold text-white">
          {hasFilter ? "No matching notifications" : "You're all caught up"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {hasFilter
            ? "Try another search or change the notification filter."
            : "New order, payment, reservation and review updates will appear here."}
        </p>

        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="mt-5 rounded-xl bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.02] p-5"
        >
          <div className="flex gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-white/5" />

            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-white/5" />

              <div className="mt-3 h-3 w-full max-w-xl rounded bg-white/5" />

              <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />

              <div className="mt-5 h-8 w-28 rounded-lg bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date) {
  if (!date) {
    return "Just now";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Recently";
  }

  const now = Date.now();
  const diff = now - value.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  if (diff < 7 * day) {
    return `${Math.floor(diff / day)}d ago`;
  }

  return value.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

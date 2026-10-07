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
  {
    value: "ALL",
    label: "All",
  },
  {
    value: "UNREAD",
    label: "Unread",
  },
  {
    value: "ORDER",
    label: "Orders",
  },
  {
    value: "PAYMENT",
    label: "Payments",
  },
  {
    value: "RESERVATION",
    label: "Reservations",
  },
  {
    value: "REVIEW",
    label: "Reviews",
  },
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
  // FETCH NOTIFICATIONS
  // ==========================================

  async function fetchNotifications(showRefresh = false) {
    if (sessionStatus !== "authenticated") {
      return;
    }

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

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications.");
      }

      const list = Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setNotifications(list);

      const calculatedUnread = list.filter((item) => !item.isRead).length;

      setUnreadCount(Number(data?.unreadCount ?? calculatedUnread));
    } catch (error) {
      console.error("FETCH NOTIFICATIONS ERROR:", error);

      setError(
        error?.message || "Something went wrong while loading notifications.",
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

    return () => {
      clearInterval(interval);
    };
  }, [sessionStatus, session?.user?.id]);

  // ==========================================
  // MARK ONE AS READ
  // ==========================================

  async function markAsRead(id) {
    if (!id || !session?.user?.id) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.error("MARK READ FAILED:", response.status, data);
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("MARK READ ERROR:", error);
    }
  }

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  async function markAllAsRead() {
    if (!session?.user?.id || unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.error("MARK ALL READ FAILED:", response.status, data);
        return;
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
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
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (filter === "UNREAD" && notification.isRead) {
        return false;
      }

      if (
        filter !== "ALL" &&
        filter !== "UNREAD" &&
        notification.type !== filter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const title = String(notification.title || "").toLowerCase();

      const message = String(notification.message || "").toLowerCase();

      const type = String(notification.type || "").toLowerCase();

      return (
        title.includes(query) || message.includes(query) || type.includes(query)
      );
    });
  }, [notifications, filter, search]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  function formatDate(date) {
    if (!date) {
      return "Recently";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Recently";
    }

    return value.toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#070707] pt-24 md:pt-28 text-white">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />

            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-white/5" />
          </div>

          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-white/10" />

                  <div className="flex-1">
                    <div className="h-4 w-48 rounded bg-white/10" />

                    <div className="mt-3 h-3 w-full rounded bg-white/5" />

                    <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-[#070707] pt-24 md:pt-28 text-white">
      {/* ======================================
          HERO
      ====================================== */}

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.13),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
                <Bell className="h-4 w-4" />
                Notifications
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Your Notifications
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                Stay updated with your latest orders, payments, reservations and
                reviews.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#E6C75A]"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================
          CONTENT
      ====================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Unable to load notifications</p>

              <p className="mt-1 text-red-300/70">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              className="shrink-0 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-medium transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* ====================================
            STATS
        ==================================== */}

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Total
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-4">
            <p className="text-xs uppercase tracking-wider text-[#D4AF37]/60">
              Unread
            </p>

            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Orders
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {notifications.filter((item) => item.type === "ORDER").length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Payments
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {notifications.filter((item) => item.type === "PAYMENT").length}
            </p>
          </div>
        </div>

        {/* ====================================
            SEARCH + FILTER
        ==================================== */}

        <div className="mb-6 space-y-4">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]/40 focus:bg-white/[0.05]"
            />
          </div>

          {/* FILTERS */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => {
              const active = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {item.label}

                  {item.value === "UNREAD" && unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-[#D4AF37] px-1.5 py-0.5 text-[10px] font-bold text-black">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ====================================
            RESULTS COUNT
        ==================================== */}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/40">
            Showing{" "}
            <span className="font-medium text-white/70">
              {filteredNotifications.length}
            </span>{" "}
            notification
            {filteredNotifications.length !== 1 ? "s" : ""}
          </p>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-[#D4AF37] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* ====================================
            NOTIFICATIONS
        ==================================== */}

        {filteredNotifications.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* ====================================
            FOOTER
        ==================================== */}

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row">
          <p>Notifications update automatically every 15 seconds.</p>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37]" />
            Live updates enabled
          </div>
        </div>
      </section>
    </main>
  );
}

// ==========================================
// NOTIFICATION CARD
// ==========================================

function NotificationCard({ notification, onRead, formatDate }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.ORDER;

  const Icon = config.icon;

  const isUnread = !notification.isRead;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition ${
        isUnread
          ? "border-[#D4AF37]/20 bg-[#D4AF37]/[0.045]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      {/* unread indicator */}
      {isUnread && (
        <div className="absolute left-0 top-0 h-full w-1 bg-[#D4AF37]" />
      )}

      <div className="flex gap-4 p-4 sm:p-5">
        {/* ICON */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            isUnread
              ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
              : "border-white/10 bg-white/[0.04] text-white/40"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-sm font-semibold ${
                    isUnread ? "text-white" : "text-white/70"
                  }`}
                >
                  {notification.title || config.label}
                </h3>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
                  {config.label}
                </span>

                {isUnread && (
                  <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                    New
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {notification.message}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs text-white/30">
              <Clock className="h-3.5 w-3.5" />

              {formatDate(notification.createdAt)}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {notification.link && (
              <Link
                href={notification.link}
                onClick={() => {
                  if (isUnread) {
                    onRead(notification.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] transition hover:text-[#E6C75A]"
              >
                View details
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}

            {isUnread && (
              <button
                type="button"
                onClick={() => onRead(notification.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
              >
                <Check className="h-3.5 w-3.5" />
                Mark as read
              </button>
            )}

            {!isUnread && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/25">
                <CheckCheck className="h-3.5 w-3.5" />
                Read
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({ search, filter }) {
  let title = "No notifications yet";
  let description = "You're all caught up. New notifications will appear here.";

  if (search) {
    title = "No results found";
    description = "Try using a different search term.";
  } else if (filter === "UNREAD") {
    title = "You're all caught up";
    description = "There are no unread notifications.";
  } else if (filter !== "ALL") {
    title = "No notifications found";
    description = `There are no ${filter.toLowerCase()} notifications right now.`;
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
        <Bell className="h-7 w-7 text-[#D4AF37]" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
        {description}
      </p>

      {search && (
        <button
          type="button"
          onClick={() => {
            window.history.replaceState(null, "", window.location.pathname);

            window.location.reload();
          }}
          className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

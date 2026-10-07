"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCheck,
  CreditCard,
  MessageSquare,
  PackageCheck,
  CalendarDays,
  X,
} from "lucide-react";

const TYPE_CONFIG = {
  ORDER: {
    icon: PackageCheck,
    label: "Order",
    className: "bg-blue-500/10 text-blue-400",
  },

  PAYMENT: {
    icon: CreditCard,
    label: "Payment",
    className: "bg-emerald-500/10 text-emerald-400",
  },

  RESERVATION: {
    icon: CalendarDays,
    label: "Reservation",
    className: "bg-purple-500/10 text-purple-400",
  },

  REVIEW: {
    icon: MessageSquare,
    label: "Review",
    className: "bg-yellow-500/10 text-yellow-400",
  },
};

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();

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

  return date.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const result = await response.json();

      if (!result?.success) {
        return;
      }

      setNotifications(result.data || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load customer notifications:", error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Failed to mark notification:", error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setLoading(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
      });

      if (!response.ok) {
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
      console.error("Failed to mark all notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`group relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
          open
            ? "border-[#d4af37]/50 bg-[#d4af37]/10"
            : "border-white/10 bg-white/[0.03] hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10"
        }`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        {unreadCount > 0 ? (
          <BellRing
            size={19}
            className="text-[#d4af37] transition-transform duration-300 group-hover:rotate-6"
          />
        ) : (
          <Bell
            size={19}
            className="text-white/80 transition-colors group-hover:text-[#d4af37]"
          />
        )}

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d4af37] px-1 text-[9px] font-bold text-[#080808] shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {open && (
        <div className="fixed left-3 right-3 top-[76px] z-[70] overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#101010]/98 shadow-[0_25px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-[390px]">
          {/* Header */}

          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <BellRing size={17} className="text-[#d4af37]" />

                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>
              </div>

              <p className="mt-1 text-[11px] text-white/40">
                Stay updated with your orders & reservations
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10 disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Mark all
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}

          <div className="max-h-[430px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <Bell size={24} className="text-white/25" />
                </div>

                <h4 className="mt-4 text-sm font-semibold text-white">
                  No notifications
                </h4>

                <p className="mt-1 text-xs text-white/40">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config =
                  TYPE_CONFIG[notification.type] || TYPE_CONFIG.ORDER;

                const Icon = config.icon;

                return (
                  <Link
                    key={notification.id}
                    href={notification.link || "/"}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative flex gap-3 border-b border-white/[0.06] px-4 py-4 transition hover:bg-white/[0.04] ${
                      !notification.isRead ? "bg-[#d4af37]/[0.045]" : ""
                    }`}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-0 top-0 h-full w-[2px] bg-[#d4af37]" />
                    )}

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.className}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`truncate text-xs font-semibold ${
                            notification.isRead ? "text-white/70" : "text-white"
                          }`}
                        >
                          {notification.title}
                        </h4>

                        {!notification.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d4af37]" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider ${config.className}`}
                        >
                          {config.label}
                        </span>

                        <span className="text-[9px] text-white/25">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}

          <div className="border-t border-white/10 p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

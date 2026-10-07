"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CreditCard,
  Loader2,
  MessageSquare,
  ShoppingBag,
  Volume2,
  VolumeX,
} from "lucide-react";

const TYPE_CONFIG = {
  ORDER: {
    icon: ShoppingBag,
    label: "Order",
  },

  RESERVATION: {
    icon: CalendarDays,
    label: "Reservation",
  },

  REVIEW: {
    icon: MessageSquare,
    label: "Review",
  },

  PAYMENT: {
    icon: CreditCard,
    label: "Payment",
  },
};

// ======================================================
// TIME FORMAT
// ======================================================

function formatTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diff = now.getTime() - date.getTime();

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

  return date.toLocaleDateString();
}

// ======================================================
// COMPONENT
// ======================================================

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const [newNotificationId, setNewNotificationId] = useState(null);

  const dropdownRef = useRef(null);

  const previousIdsRef = useRef([]);

  const firstLoadRef = useRef(true);

  const audioContextRef = useRef(null);

  // ====================================================
  // CREATE NOTIFICATION SOUND
  // ====================================================

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) {
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const context = audioContextRef.current;

      if (context.state === "suspended") {
        context.resume();
      }

      const oscillator = context.createOscillator();

      const gain = context.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(880, context.currentTime);

      oscillator.frequency.setValueAtTime(1174, context.currentTime + 0.12);

      gain.gain.setValueAtTime(0.0001, context.currentTime);

      gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.02);

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.35,
      );

      oscillator.connect(gain);

      gain.connect(context.destination);

      oscillator.start();

      oscillator.stop(context.currentTime + 0.35);
    } catch (error) {
      console.error("NOTIFICATION SOUND ERROR:", error);
    }
  }, [soundEnabled]);

  // ====================================================
  // LOAD NOTIFICATIONS
  // ====================================================

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load notifications.");
      }

      const nextNotifications = Array.isArray(result.notifications)
        ? result.notifications
        : [];

      const nextIds = nextNotifications.map((notification) => notification.id);

      // ------------------------------------------
      // Detect NEW notification
      // ------------------------------------------

      if (!firstLoadRef.current) {
        const previousIds = previousIdsRef.current;

        const newNotification = nextNotifications.find(
          (notification) => !previousIds.includes(notification.id),
        );

        if (newNotification) {
          setNewNotificationId(newNotification.id);

          playNotificationSound();

          setTimeout(() => {
            setNewNotificationId(null);
          }, 4000);
        }
      }

      previousIdsRef.current = nextIds;

      firstLoadRef.current = false;

      setNotifications(nextNotifications);

      setUnreadCount(Number(result.unreadCount || 0));
    } catch (error) {
      console.error("NOTIFICATION LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound]);

  // ====================================================
  // INITIAL LOAD + AUTO REFRESH
  // ====================================================

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // ====================================================
  // LOAD WHEN OPENED
  // ====================================================

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  // ====================================================
  // CLICK OUTSIDE
  // ====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ====================================================
  // ENABLE SOUND
  // ====================================================

  const toggleSound = async () => {
    if (!soundEnabled) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (AudioContext) {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }

          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error("ENABLE SOUND ERROR:", error);
      }
    }

    setSoundEnabled((current) => !current);
  };

  // ====================================================
  // MARK SINGLE AS READ
  // ====================================================

  const markAsRead = async (notificationId) => {
    try {
      const notification = notifications.find(
        (item) => item.id === notificationId,
      );

      if (!notification) {
        return;
      }

      if (notification.isRead) {
        return;
      }

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: notificationId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to mark notification as read.",
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
    }
  };

  // ====================================================
  // MARK ALL AS READ
  // ====================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);

      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to mark all notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS ERROR:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  // ====================================================
  // NOTIFICATION CLICK
  // ====================================================

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setOpen(false);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div ref={dropdownRef} className="relative">
      {/* ================================================= */}
      {/* BELL BUTTON */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);

          if (!open) {
            loadNotifications();
          }
        }}
        aria-label="Notifications"
        aria-expanded={open}
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-white/10
          bg-white/[0.04]
          text-white/70
          transition-all
          duration-300
          hover:border-[#d4af37]/40
          hover:bg-[#d4af37]/10
          hover:text-[#d4af37]
          sm:h-11
          sm:w-11
        "
      >
        <Bell
          size={19}
          strokeWidth={1.8}
          className={unreadCount > 0 ? "animate-pulse" : ""}
        />

        {/* Unread Badge */}

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              border-2
              border-[#080808]
              bg-[#d4af37]
              px-1
              text-[9px]
              font-bold
              text-black
              shadow-lg
              shadow-[#d4af37]/20
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ================================================= */}
      {/* DROPDOWN */}
      {/* ================================================= */}

      {open && (
        <div
          className="
            fixed
            left-3
            right-3
            top-[72px]
            z-[100]
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-[#111111]
            shadow-2xl
            shadow-black/60
            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-14
            sm:w-[380px]
            sm:max-w-[calc(100vw-2rem)]
          "
        >
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              border-b
              border-white/10
              px-4
              py-4
            "
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>

              <p className="mt-0.5 text-[11px] text-white/40">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {/* Sound */}

              <button
                type="button"
                onClick={toggleSound}
                title={
                  soundEnabled
                    ? "Disable notification sound"
                    : "Enable notification sound"
                }
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-white/35
                  transition
                  hover:bg-white/5
                  hover:text-[#d4af37]
                "
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Mark All */}

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0 || markingAll}
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-lg
                  px-2
                  py-2
                  text-[10px]
                  font-medium
                  text-[#d4af37]
                  transition
                  hover:bg-[#d4af37]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                  sm:text-xs
                "
              >
                {markingAll ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={14} />
                )}

                <span className="hidden xs:inline">Mark all</span>

                <span className="sm:hidden">Read</span>
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* NOTIFICATION LIST */}
          {/* ================================================= */}

          <div
            className="
              max-h-[calc(100vh-180px)]
              overflow-y-auto
              sm:max-h-[420px]
            "
          >
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-14">
                <Loader2
                  size={24}
                  className="
                    animate-spin
                    text-[#d4af37]
                  "
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div
                  className="
                    mx-auto
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-white/[0.05]
                    text-white/30
                  "
                >
                  <Bell size={20} />
                </div>

                <p className="mt-3 text-sm text-white/60">
                  No notifications yet.
                </p>

                <p className="mt-1 text-[11px] text-white/30">
                  New activity will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => {
                const config =
                  TYPE_CONFIG[notification.type] || TYPE_CONFIG.ORDER;

                const Icon = config.icon;

                const isNew = newNotificationId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`
                        group
                        relative
                        border-b
                        border-white/[0.06]
                        transition-all
                        duration-300
                        hover:bg-white/[0.03]
                        ${!notification.isRead ? "bg-[#d4af37]/[0.035]" : ""}
                        ${isNew ? "bg-[#d4af37]/10" : ""}
                      `}
                  >
                    {/* New indicator */}

                    {isNew && (
                      <div
                        className="
                            absolute
                            left-0
                            top-0
                            h-full
                            w-0.5
                            bg-[#d4af37]
                            shadow-lg
                            shadow-[#d4af37]
                          "
                      />
                    )}

                    <Link
                      href={notification.link || "/dashboard/notifications"}
                      onClick={() => handleNotificationClick(notification)}
                      className="
                          flex
                          gap-3
                          px-4
                          py-3.5
                        "
                    >
                      {/* Icon */}

                      <div
                        className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            transition
                            ${
                              !notification.isRead || isNew
                                ? `
                                  bg-[#d4af37]/10
                                  text-[#d4af37]
                                `
                                : `
                                  bg-white/[0.05]
                                  text-white/40
                                `
                            }
                          `}
                      >
                        <Icon size={17} />
                      </div>

                      {/* Content */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`
                                line-clamp-1
                                text-xs
                                sm:text-sm
                                ${
                                  !notification.isRead
                                    ? "font-semibold text-white"
                                    : "font-medium text-white/70"
                                }
                              `}
                          >
                            {notification.title}
                          </p>

                          {!notification.isRead && (
                            <span
                              className="
                                  mt-1.5
                                  h-1.5
                                  w-1.5
                                  shrink-0
                                  rounded-full
                                  bg-[#d4af37]
                                "
                            />
                          )}
                        </div>

                        <p
                          className="
                              mt-1
                              line-clamp-2
                              text-[10px]
                              leading-5
                              text-white/40
                              sm:text-xs
                            "
                        >
                          {notification.message}
                        </p>

                        <div
                          className="
                              mt-1.5
                              flex
                              items-center
                              gap-2
                              text-[9px]
                              text-white/25
                              sm:text-[10px]
                            "
                        >
                          <span>{config.label}</span>

                          <span>•</span>

                          <span>{formatTime(notification.createdAt)}</span>

                          {isNew && (
                            <>
                              <span>•</span>

                              <span className="font-medium text-[#d4af37]">
                                New
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Mark Single Read */}

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                        className="
                            absolute
                            bottom-3
                            right-3
                            hidden
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-md
                            bg-white/[0.06]
                            text-white/40
                            transition
                            hover:bg-[#d4af37]/10
                            hover:text-[#d4af37]
                            group-hover:flex
                          "
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div
            className="
              border-t
              border-white/10
              p-3
            "
          >
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="
                flex
                w-full
                items-center
                justify-center
                rounded-xl
                border
                border-[#d4af37]/20
                bg-[#d4af37]/[0.06]
                px-4
                py-2.5
                text-xs
                font-semibold
                text-[#d4af37]
                transition
                hover:border-[#d4af37]/40
                hover:bg-[#d4af37]/10
              "
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

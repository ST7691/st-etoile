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
  X,
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

  // Review state
  const [reviewOrder, setReviewOrder] = useState(null);

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

        const text = await response.text();

        let result = {};

        try {
          result = text ? JSON.parse(text) : {};
        } catch {
          throw new Error("Server returned an invalid response.");
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || result.error || "Failed to load orders.",
          );
        }

        if (active) {
          setOrders(
            Array.isArray(result.data)
              ? result.data
              : Array.isArray(result.orders)
                ? result.orders
                : [],
          );
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

  async function refreshOrders() {
    try {
      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/login?callbackUrl=/orders";
        return;
      }

      const text = await response.text();

      let result = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Failed to refresh orders.",
        );
      }

      setOrders(
        Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.orders)
            ? result.orders
            : [],
      );
    } catch (error) {
      console.error("ORDERS REFRESH ERROR:", error);
    }
  }

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
              <OrderCard
                key={order.id}
                order={order}
                onReview={() => setReviewOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={async () => {
            setReviewOrder(null);
            await refreshOrders();
          }}
        />
      )}
    </main>
  );
}

function OrderCard({ order, onReview }) {
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

  const itemCount = (order.items || []).reduce(
    (total, item) => total + Number(item.quantity || 0),
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
            ৳{Number(order.total || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Items */}
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex -space-x-3">
              {(order.items || []).slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[#111] bg-[#181818]"
                >
                  {item.menuItem?.image ? (
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name || "Food"}
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
                {(order.items || [])
                  .map((item) => item.menuItem?.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          {/* Payment + Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
            <div>
              <p className="text-xs text-white/30">Payment</p>

              <p className="mt-1 text-sm font-medium text-white/70">
                {order.paymentMethod === "COD"
                  ? "Cash on Delivery"
                  : order.paymentMethod}
              </p>
            </div>

            {/* Review */}
            {order.status === "DELIVERED" && (
              <button
                type="button"
                onClick={onReview}
                className="group flex h-11 items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 px-5 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
              >
                ⭐ Review
              </button>
            )}

            {/* Details */}
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

/* =========================================================
   REVIEW MODAL
========================================================= */

function ReviewModal({ order, onClose, onSuccess }) {
  // Store only the actual MenuItem ID.
  const [selectedItemId, setSelectedItemId] = useState("");

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const items = Array.isArray(order?.items) ? order.items : [];

  /*
   * Select the first valid menu item automatically.
   *
   * We support both:
   * item.menuItemId
   *
   * and:
   * item.menuItem.id
   *
   * This prevents "Menu item is required" when Prisma
   * returns the relation but the foreign-key field is not
   * present in the response.
   */
  useEffect(() => {
    if (!items.length) {
      setSelectedItemId("");
      return;
    }

    const firstValidItem = items.find((item) => {
      return item?.menuItemId || item?.menuItem?.id;
    });

    if (firstValidItem) {
      setSelectedItemId(
        firstValidItem.menuItemId || firstValidItem.menuItem.id,
      );
    }
  }, [order]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Find the selected order item.
     */
    const selectedOrderItem = items.find((item) => {
      const id = item?.menuItemId || item?.menuItem?.id;

      return id === selectedItemId;
    });

    /*
     * Resolve the real MenuItem ID.
     */
    const menuItemId =
      selectedOrderItem?.menuItemId ||
      selectedOrderItem?.menuItem?.id ||
      selectedItemId;

    console.log("REVIEW DEBUG:", {
      selectedItemId,
      menuItemId,
      selectedOrderItem,
    });

    if (!menuItemId) {
      setError(
        "Unable to identify this food item. Please close the review window and try again.",
      );
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    if (comment.trim().length < 5) {
      setError("Review must be at least 5 characters.");
      return;
    }

    if (comment.trim().length > 1000) {
      setError("Review must be 1000 characters or less.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/reviews", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          menuItemId,
          rating,
          comment: comment.trim(),
        }),
      });

      const text = await response.text();

      let result = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.message || "Failed to submit review.",
        );
      }

      setSuccess("Review submitted successfully! ⭐");

      setTimeout(() => {
        onSuccess?.(result.review || result.data);
      }, 900);
    } catch (error) {
      console.error("REVIEW SUBMIT ERROR:", error);

      setError(
        error.message || "Something went wrong while submitting your review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4af37]/20 bg-[#111] shadow-2xl shadow-black/50">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111]/95 px-5 py-5 backdrop-blur md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
              ST Restaurant
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#f5f1e8]">
              Write a Review
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Share your experience with our food.
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#d4af37]/40 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 md:p-6">
          {/* Select Food */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-[#f5f1e8]">
              Select Food
            </label>

            {!items.length ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                No food items were found in this order.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                  const menuItem = item?.menuItem;

                  if (!menuItem) {
                    return null;
                  }

                  /*
                   * Prefer OrderItem.menuItemId.
                   * Fallback to related MenuItem.id.
                   */
                  const menuItemId = item.menuItemId || menuItem.id;

                  const selected = selectedItemId === menuItemId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setSelectedItemId(menuItemId);
                        setError("");
                        setSuccess("");
                      }}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-[#d4af37]/60 bg-[#d4af37]/10"
                          : "border-white/10 bg-white/[0.03] hover:border-[#d4af37]/30"
                      }`}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#181818]">
                        {menuItem.image ? (
                          <img
                            src={menuItem.image}
                            alt={menuItem.name || "Food"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-white/30" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#f5f1e8]">
                          {menuItem.name}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#d4af37] bg-[#d4af37]"
                            : "border-white/20"
                        }`}
                      >
                        {selected && (
                          <span className="text-xs font-bold text-black">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-[#f5f1e8]">
              Your Rating
            </label>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);

                return (
                  <button
                    key={star}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setRating(star);
                      setError("");
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl leading-none transition hover:scale-110 disabled:cursor-not-allowed"
                    aria-label={`${star} star`}
                  >
                    <span
                      className={active ? "text-[#d4af37]" : "text-white/15"}
                    >
                      ★
                    </span>
                  </button>
                );
              })}

              <span className="ml-3 text-sm text-white/45">{rating}/5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-sm font-semibold text-[#f5f1e8]"
              >
                Your Review
              </label>

              <span className="text-xs text-white/30">
                {comment.length}/1000
              </span>
            </div>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setError("");
              }}
              maxLength={1000}
              rows={5}
              disabled={submitting}
              placeholder="Tell us what you liked about this food..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#f5f1e8] outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/50 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || Boolean(success) || !selectedItemId}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] px-6 py-3.5 font-semibold text-black transition hover:bg-[#e4c65a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>⭐ Submit Review</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

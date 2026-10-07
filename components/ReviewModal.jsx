"use client";

import { useEffect, useState } from "react";

export default function ReviewModal({ open, onClose, order, onSuccess }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      setRating(5);
      setHoverRating(0);
      setComment("");
      setError("");
      setSuccess("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open || !order) return null;

  const items = order.items || [];

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedItem) {
      setError("Please select a food item.");
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

    try {
      setSubmitting(true);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId: selectedItem.menuItemId,
          rating,
          comment: comment.trim(),
        }),
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSuccess("Review submitted successfully! ⭐");

      setComment("");
      setRating(5);

      if (onSuccess) {
        onSuccess(data.review);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error("REVIEW SUBMIT ERROR:", error);
      setError(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
              Customer Feedback
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Write a Review
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Share your experience with our food.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-gray-400 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-400"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Select Food */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-white">
              Select Food
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const menuItem = item.menuItem;

                if (!menuItem) return null;

                const isSelected = selectedItem?.menuItemId === item.menuItemId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {menuItem.image ? (
                        <img
                          src={menuItem.image}
                          alt={menuItem.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {menuItem.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-amber-400 bg-amber-400"
                          : "border-gray-600"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-xs font-bold text-black">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-white">
              Your Rating
            </label>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl leading-none transition hover:scale-110"
                    aria-label={`${star} star`}
                  >
                    <span
                      className={active ? "text-amber-400" : "text-gray-700"}
                    >
                      ★
                    </span>
                  </button>
                );
              })}

              <span className="ml-2 text-sm text-gray-400">{rating}/5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-sm font-semibold text-white"
              >
                Your Review
              </label>

              <span className="text-xs text-gray-500">
                {comment.length}/1000
              </span>
            </div>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Tell us what you liked about this food..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-amber-400/60 focus:bg-white/[0.06]"
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
            disabled={submitting || Boolean(success)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3.5 font-bold text-black transition hover:from-amber-300 hover:to-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
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

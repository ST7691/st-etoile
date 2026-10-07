"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Star,
  Trash2,
  RefreshCw,
  MessageSquare,
  Users,
  Award,
  AlertCircle,
  X,
  Mail,
  Utensils,
  CalendarDays,
} from "lucide-react";

const FILTERS = [
  { value: "ALL", label: "All Reviews" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
];

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating = 0, size = 15 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Number(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-600"
          }
        />
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>

          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div className="shrink-0 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
          <Icon size={20} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-white/10" />

        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-2 h-3 w-48 rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-5 h-4 w-28 rounded bg-white/10" />

      <div className="mt-4 h-16 rounded bg-white/10" />

      <div className="mt-4 h-14 rounded-xl bg-white/10" />
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    fiveStar: 0,
    oneStar: 0,
  });

  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setError("");

      const params = new URLSearchParams();

      if (rating !== "ALL") {
        params.set("rating", rating);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const response = await fetch(
        `/api/admin/reviews${query ? `?${query}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to load reviews.",
        );
      }

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load reviews.");
      }

      /*
       * IMPORTANT:
       *
       * API returns:
       *
       * data: [...]
       *
       * stats: {
       *   totalReviews,
       *   averageRating,
       *   ratingStats: {
       *     five,
       *     four,
       *     three,
       *     two,
       *     one
       *   }
       * }
       */

      setReviews(Array.isArray(data.data) ? data.data : []);

      setStats({
        total: Number(data.stats?.totalReviews || 0),

        average: Number(data.stats?.averageRating || 0),

        fiveStar: Number(data.stats?.ratingStats?.five || 0),

        oneStar: Number(data.stats?.ratingStats?.one || 0),
      });
    } catch (err) {
      console.error("REVIEWS FETCH ERROR:", err);

      setError(err?.message || "Something went wrong while loading reviews.");

      setReviews([]);

      setStats({
        total: 0,
        average: 0,
        fiveStar: 0,
        oneStar: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rating, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/admin/reviews?id=${encodeURIComponent(deleteId)}`,
        {
          method: "DELETE",
        },
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to delete review.",
        );
      }

      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete review.");
      }

      setDeleteId(null);

      if (selectedReview?.id === deleteId) {
        setSelectedReview(null);
      }

      await fetchReviews();
    } catch (err) {
      console.error("DELETE REVIEW ERROR:", err);

      alert(err?.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return Array.isArray(reviews) ? reviews : [];
  }, [reviews]);

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* HEADER */}
      <div className="border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2.5">
                  <MessageSquare size={22} className="text-yellow-400" />
                </div>

                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">
                    Customer Reviews
                  </h1>

                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Manage customer feedback and ratings
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-medium">Unable to load reviews</p>

              <p className="mt-1 text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Reviews"
            value={stats.total}
            icon={MessageSquare}
            description="All customer reviews"
          />

          <StatCard
            title="Average Rating"
            value={`${stats.average.toFixed(1)} / 5`}
            icon={Award}
            description="Overall menu rating"
          />

          <StatCard
            title="5 Star Reviews"
            value={stats.fiveStar}
            icon={Star}
            description="Excellent feedback"
          />

          <StatCard
            title="1 Star Reviews"
            value={stats.oneStar}
            icon={AlertCircle}
            description="Needs attention"
          />
        </div>

        {/* FILTER AREA */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, comment or menu..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
              />
            </div>

            {/* RATING FILTER */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((item) => {
                const active = rating === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRating(item.value)}
                    className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {item.value !== "ALL" && (
                      <span className="mr-1">{item.value}★</span>
                    )}

                    {item.value === "ALL" ? item.label : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <LoadingCard key={item} />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
                <MessageSquare size={24} className="text-gray-500" />
              </div>

              <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>

              <p className="mt-2 text-sm text-gray-500">
                {search.trim() || rating !== "ALL"
                  ? "Try changing your search or rating filter."
                  : "Customer reviews will appear here after they submit one."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-500/20 hover:bg-white/[0.045]"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* AVATAR */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-500/20 bg-yellow-500/10">
                        {review.user?.image ? (
                          <img
                            src={review.user.image}
                            alt={review.user?.name || "Customer"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users size={19} className="text-yellow-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {review.user?.name || "Anonymous Customer"}
                        </h3>

                        <p className="truncate text-xs text-gray-500">
                          {review.user?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* DELETE */}
                    <button
                      type="button"
                      onClick={() => setDeleteId(review.id)}
                      className="rounded-lg p-2 text-gray-500 opacity-100 transition hover:bg-red-500/10 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100"
                      title="Delete review"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  {/* RATING */}
                  <div className="mt-4 flex items-center gap-3">
                    <Stars rating={review.rating} />

                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {/* COMMENT */}
                  <button
                    type="button"
                    onClick={() => setSelectedReview(review)}
                    className="mt-4 block w-full text-left"
                  >
                    <p className="line-clamp-3 text-sm leading-6 text-gray-300">
                      “{review.comment}”
                    </p>

                    <span className="mt-2 inline-block text-xs text-yellow-500/80">
                      View full review →
                    </span>
                  </button>

                  {/* MENU ITEM */}
                  {review.menuItem && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
                      {review.menuItem.image ? (
                        <img
                          src={review.menuItem.image}
                          alt={review.menuItem.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                          <Utensils size={16} className="text-yellow-400" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-gray-600">
                          Menu Item
                        </p>

                        <p className="truncate text-sm font-medium text-gray-300">
                          {review.menuItem.name || "Unknown Menu Item"}
                        </p>

                        {typeof review.menuItem.price === "number" && (
                          <p className="mt-0.5 text-xs text-yellow-500/80">
                            ৳{Number(review.menuItem.price).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FULL REVIEW MODAL */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-500/20 bg-yellow-500/10">
                  {selectedReview.user?.image ? (
                    <img
                      src={selectedReview.user.image}
                      alt={selectedReview.user?.name || "Customer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users size={19} className="text-yellow-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-semibold">
                    {selectedReview.user?.name || "Anonymous Customer"}
                  </h3>

                  {selectedReview.user?.email && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail size={12} />

                      <span className="truncate">
                        {selectedReview.user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* RATING */}
            <div className="mt-5 flex items-center gap-3">
              <Stars rating={selectedReview.rating} size={17} />

              <span className="text-xs text-gray-500">
                {selectedReview.rating}/5
              </span>
            </div>

            {/* DATE */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <CalendarDays size={14} />

              {formatDate(selectedReview.createdAt)}
            </div>

            {/* MENU ITEM */}
            {selectedReview.menuItem && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                {selectedReview.menuItem.image ? (
                  <img
                    src={selectedReview.menuItem.image}
                    alt={selectedReview.menuItem.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Utensils size={18} className="text-yellow-400" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Reviewed Menu Item</p>

                  <p className="mt-1 truncate font-medium text-yellow-400">
                    {selectedReview.menuItem.name}
                  </p>
                </div>
              </div>
            )}

            {/* COMMENT */}
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-600">
                Customer Feedback
              </p>

              <p className="mt-3 text-sm leading-7 text-gray-300">
                “{selectedReview.comment}”
              </p>
            </div>

            {/* DELETE */}
            <button
              type="button"
              onClick={() => {
                setDeleteId(selectedReview.id);

                setSelectedReview(null);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
            >
              <Trash2 size={16} />
              Delete Review
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 size={21} className="text-red-400" />
            </div>

            <h3 className="mt-4 text-lg font-semibold">Delete this review?</h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This action cannot be undone. The review will be permanently
              removed.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <RefreshCw size={15} className="animate-spin" />}

                {deleting ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Star,
  MessageSquare,
  Users,
  Utensils,
  RefreshCw,
  Quote,
  ChevronDown,
  Award,
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
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Stars({ rating = 0, size = 17 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Number(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/15"
          }
        />
      ))}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "C";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function RatingBar({ stars, count, total }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-12 items-center justify-end gap-1 text-sm text-gray-400">
        <span>{stars}</span>
        <Star size={13} className="fill-yellow-400 text-yellow-400" />
      </div>

      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-yellow-400 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <span className="w-8 text-right text-xs text-gray-500">{count}</span>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-yellow-500/20 hover:bg-white/[0.055]">
      {/* QUOTE */}
      <div className="absolute right-5 top-5 opacity-10">
        <Quote size={46} className="text-yellow-400" />
      </div>

      {/* CUSTOMER */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-500/20 bg-yellow-500/10">
          {review.user?.image ? (
            <img
              src={review.user.image}
              alt={review.user?.name || "Customer"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-yellow-400">
              {getInitials(review.user?.name)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">
            {review.user?.name || "Anonymous Customer"}
          </h3>

          <p className="text-xs text-gray-500">
            {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* RATING */}
      <div className="relative mt-5 flex items-center gap-3">
        <Stars rating={review.rating} />

        <span className="text-xs font-medium text-gray-500">
          {review.rating}.0
        </span>
      </div>

      {/* COMMENT */}
      <p className="relative mt-5 text-sm leading-7 text-gray-300">
        “{review.comment}”
      </p>

      {/* MENU */}
      {review.menuItem && (
        <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-3">
          {review.menuItem.image ? (
            <img
              src={review.menuItem.image}
              alt={review.menuItem.name}
              className="h-11 w-11 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
              <Utensils size={17} className="text-yellow-400" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Reviewed dish
            </p>

            <p className="truncate text-sm font-medium text-gray-300">
              {review.menuItem.name}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingStats: {
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    },
  });

  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        `/api/public/reviews${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load reviews.");
      }

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load reviews.");
      }

      setReviews(Array.isArray(data.data) ? data.data : []);

      setStats({
        totalReviews: Number(data.stats?.totalReviews || 0),

        averageRating: Number(data.stats?.averageRating || 0),

        ratingStats: {
          five: Number(data.stats?.ratingStats?.five || 0),
          four: Number(data.stats?.ratingStats?.four || 0),
          three: Number(data.stats?.ratingStats?.three || 0),
          two: Number(data.stats?.ratingStats?.two || 0),
          one: Number(data.stats?.ratingStats?.one || 0),
        },
      });
    } catch (err) {
      console.error("PUBLIC REVIEWS ERROR:", err);

      setError(err?.message || "Failed to load reviews.");

      setReviews([]);
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

  const total = stats.totalReviews;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10">
              <MessageSquare size={25} className="text-yellow-400" />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-500">
              Guest Experiences
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              What Our Guests Say
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
              Discover what our customers think about our food, service, and
              dining experience.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* SUMMARY */}
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          {/* OVERALL */}
          <div className="rounded-3xl border border-yellow-500/15 bg-gradient-to-br from-yellow-500/[0.09] to-white/[0.02] p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Overall Rating
            </p>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-6xl font-bold text-white">
                {stats.averageRating.toFixed(1)}
              </span>

              <span className="mb-2 text-gray-500">/ 5</span>
            </div>

            <div className="mt-4">
              <Stars rating={Math.round(stats.averageRating)} size={20} />
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Based on <span className="font-semibold text-white">{total}</span>{" "}
              customer {total === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* BREAKDOWN */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">Rating Breakdown</h2>

                <p className="mt-1 text-xs text-gray-500">
                  Customer rating distribution
                </p>
              </div>

              <div className="rounded-xl bg-yellow-500/10 p-2.5">
                <Award size={19} className="text-yellow-400" />
              </div>
            </div>

            <div className="space-y-3">
              <RatingBar
                stars={5}
                count={stats.ratingStats.five}
                total={total}
              />

              <RatingBar
                stars={4}
                count={stats.ratingStats.four}
                total={total}
              />

              <RatingBar
                stars={3}
                count={stats.ratingStats.three}
                total={total}
              />

              <RatingBar
                stars={2}
                count={stats.ratingStats.two}
                total={total}
              />

              <RatingBar
                stars={1}
                count={stats.ratingStats.one}
                total={total}
              />
            </div>
          </div>
        </div>

        {/* SEARCH / FILTER */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviews or dishes..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-500/40"
              />
            </div>

            {/* FILTER */}
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
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
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

            {/* REFRESH */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-300 transition hover:border-yellow-500/30 hover:text-yellow-400 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* REVIEWS */}
        <div className="mt-8">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05]">
                <MessageSquare size={27} className="text-gray-500" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">No reviews found</h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {search.trim() || rating !== "ALL"
                  ? "Try changing your search or rating filter."
                  : "Be the first customer to share your experience."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Customer Reviews</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"} found
                  </p>
                </div>

                <div className="hidden items-center gap-2 text-xs text-gray-500 sm:flex">
                  <Users size={15} />
                  Real customer experiences
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

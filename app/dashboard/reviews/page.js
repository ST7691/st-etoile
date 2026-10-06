"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  Home,
  LayoutDashboard,
  MessageSquare,
  Search,
  Star,
  Trash2,
  RefreshCw,
  User,
  Utensils,
  TrendingUp,
  Award,
} from "lucide-react";

export default function AdminReviewsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [deletingId, setDeletingId] = useState(null);

  /* =========================================================
     LOAD REVIEWS
  ========================================================= */

  async function loadReviews() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/reviews", {
        cache: "no-store",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login?callbackUrl=/dashboard/reviews");
        return;
      }

      if (response.status === 403) {
        setReviews([]);
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load reviews.");
      }

      setReviews(result.data || []);
    } catch (error) {
      console.error("LOAD REVIEWS ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load reviews",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login?callbackUrl=/dashboard/reviews");
      return;
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      setLoading(false);
      return;
    }

    loadReviews();
  }, [session, status]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.comment?.toLowerCase().includes(query) ||
        review.user?.name?.toLowerCase().includes(query) ||
        review.user?.email?.toLowerCase().includes(query) ||
        review.menuItem?.name?.toLowerCase().includes(query);

      const matchesRating =
        ratingFilter === "all" || review.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const total = reviews.length;

    const average =
      total > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
        : 0;

    const fiveStar = reviews.filter((review) => review.rating === 5).length;

    const positive = total > 0 ? Math.round((fiveStar / total) * 100) : 0;

    return {
      total,
      average: average.toFixed(1),
      fiveStar,
      positive,
    };
  }, [reviews]);

  /* =========================================================
     DELETE REVIEW
  ========================================================= */

  async function handleDelete(review) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this review?",
      html: `
        <p style="color:#aaa">
          This review will be permanently removed.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Delete Review",
      cancelButtonText: "Cancel",
      background: "#111",
      color: "#fff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#333",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(review.id);

      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete review.");
      }

      setReviews((prev) => prev.filter((item) => item.id !== review.id));

      Swal.fire({
        icon: "success",
        title: "Review deleted",
        text: "The review has been removed successfully.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("DELETE REVIEW ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Something went wrong.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     ACCESS DENIED
  ========================================================= */

  if (
    status !== "loading" &&
    session?.user &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "STAFF"
  ) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 pb-20 pt-32">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-[#111] p-10 text-center">
          <h1 className="text-3xl font-semibold text-white">Access Denied</h1>

          <p className="mt-3 text-white/40">
            You do not have permission to manage reviews.
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-white/60"
            >
              <Home size={16} />
              Home
            </Link>

            <Link
              href="/dashboard"
              className="gold-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#080808] px-5 pb-24 pt-28 sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            TOP NAV
        ===================================================== */}

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Home size={15} />
            Home
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-2.5 text-sm text-[#d4af37] transition hover:bg-[#d4af37]/10"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#d4af37]">
              Customer Feedback
            </p>

            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Reviews & Ratings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
              Monitor customer feedback, ratings and menu performance from one
              premium dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/60 transition hover:border-[#d4af37]/30 hover:text-[#d4af37] disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<MessageSquare size={20} />}
            label="Total Reviews"
            value={stats.total}
          />

          <StatCard
            icon={<Star size={20} />}
            label="Average Rating"
            value={`${stats.average}/5`}
          />

          <StatCard
            icon={<Award size={20} />}
            label="5 Star Reviews"
            value={stats.fiveStar}
          />

          <StatCard
            icon={<TrendingUp size={20} />}
            label="5 Star Ratio"
            value={`${stats.positive}%`}
          />
        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, email, dish or review..."
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d4af37]/40"
              />
            </div>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="h-12 rounded-xl border border-white/10 bg-[#181818] px-4 text-sm text-white outline-none focus:border-[#d4af37]/40"
            >
              <option value="all">All Ratings</option>

              <option value="5">5 Stars</option>

              <option value="4">4 Stars</option>

              <option value="3">3 Stars</option>

              <option value="2">2 Stars</option>

              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* =====================================================
            RESULTS
        ===================================================== */}

        <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Customer Reviews
              </h2>

              <p className="mt-1 text-sm text-white/30">
                Showing {filteredReviews.length} of {reviews.length} reviews
              </p>
            </div>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-white/10 bg-[#111] p-6"
                >
                  <div className="h-5 w-32 rounded bg-white/5" />

                  <div className="mt-5 h-4 w-24 rounded bg-white/5" />

                  <div className="mt-5 h-20 rounded bg-white/5" />

                  <div className="mt-5 h-10 rounded bg-white/5" />
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-20 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-white/10" />

              <h3 className="mt-5 text-xl font-semibold text-white">
                No reviews found
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Try changing your search or rating filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ===========================================================
   STAT CARD
=========================================================== */

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/20">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm text-white/35">{label}</p>

      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

/* ===========================================================
   REVIEW CARD
=========================================================== */

function ReviewCard({ review, deletingId, onDelete }) {
  const customerName = review.user?.name || "ST Customer";

  const menuName = review.menuItem?.name || "Menu Item";

  const avatar =
    review.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      customerName,
    )}&background=111111&color=d4af37`;

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div className="group rounded-2xl border border-white/10 bg-[#111] p-6 transition hover:border-[#d4af37]/20">
      {/* Header */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <img
              src={avatar}
              alt={customerName}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {customerName}
            </h3>

            <p className="truncate text-xs text-white/30">
              {review.user?.email || "No email"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(review)}
          disabled={deletingId === review.id}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          title="Delete review"
        >
          {deletingId === review.id ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Rating */}

      <div className="mt-5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= review.rating
                ? "fill-[#d4af37] text-[#d4af37]"
                : "text-white/15"
            }
          />
        ))}

        <span className="ml-2 text-sm font-medium text-[#d4af37]">
          {review.rating}.0
        </span>
      </div>

      {/* Review */}

      <p className="mt-5 leading-7 text-white/55">“{review.comment}”</p>

      {/* Menu */}

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
          {review.menuItem?.image ? (
            <img
              src={review.menuItem.image}
              alt={menuName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Utensils size={17} className="text-white/20" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-white/25">
            Reviewed Dish
          </p>

          <p className="mt-0.5 truncate text-sm font-medium text-white/70">
            {menuName}
          </p>
        </div>

        <Utensils size={15} className="text-[#d4af37]" />
      </div>

      {/* Footer */}

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-xs text-white/25">
          <User size={13} />
          Customer
        </div>

        <span className="text-xs text-white/25">{date}</span>
      </div>
    </div>
  );
}

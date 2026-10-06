"use client";

import { useEffect, useState } from "react";
import { Star, UserRound, Send } from "lucide-react";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ReviewSection({ menuItemId }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/${menuItemId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load reviews.");
      }

      setReviews(Array.isArray(data?.data) ? data.data : []);

      setAverageRating(Number(data?.stats?.averageRating || 0));
    } catch (error) {
      console.error("REVIEWS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      if (menuItemId) {
        
      fetchReviews();
    }
  }, [menuItemId]);

  const submitReview = async (event) => {
    event.preventDefault();

    if (!session?.user) {
      router.push(`/login?callbackUrl=/menu`);
      return;
    }

    if (!comment.trim()) {
      Swal.fire({
        title: "Write a review",
        text: "Please share your experience.",
        icon: "warning",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });

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
          menuItemId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Failed to submit review.");
      }

      setComment("");
      setRating(5);

      await fetchReviews();

      Swal.fire({
        title: "Thank You!",
        text: "Your review has been submitted.",
        icon: "success",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } catch (error) {
      Swal.fire({
        title: "Review Failed",
        text: error.message || "Unable to submit your review.",
        icon: "error",
        background: "#111",
        color: "#f5f1e8",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-white/10 pt-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]">
            Customer Experience
          </p>

          <h2 className="mt-2 text-3xl font-bold">Reviews & Ratings</h2>

          <p className="mt-2 text-sm text-white/45">
            See what our guests think about this dish.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <Star size={22} fill="currentColor" className="text-[#d4af37]" />

            <div>
              <p className="text-xl font-bold text-[#d4af37]">
                {averageRating.toFixed(1)}
              </p>

              <p className="text-xs text-white/35">
                {reviews.length} review
                {reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {session?.user && (
        <form
          onSubmit={submitReview}
          className="mb-10 rounded-3xl border border-white/10 bg-[#101010] p-6"
        >
          <h3 className="text-lg font-semibold">Share Your Experience</h3>

          <div className="mt-5">
            <p className="mb-3 text-sm text-white/50">Your Rating</p>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="transition hover:scale-110"
                >
                  <Star
                    size={25}
                    fill={value <= rating ? "currentColor" : "none"}
                    className={
                      value <= rating ? "text-[#d4af37]" : "text-white/20"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Tell us about your experience..."
            className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#d4af37]/40"
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-xs text-white/25">{comment.length}/1000</span>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />

              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#101010] p-10 text-center">
          <Star size={40} className="mx-auto text-white/15" />

          <h3 className="mt-4 font-semibold">No reviews yet</h3>

          <p className="mt-2 text-sm text-white/35">
            Be the first customer to review this dish.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }) {
  const date = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(review.createdAt));

  return (
    <article className="rounded-2xl border border-white/10 bg-[#101010] p-5 transition hover:border-[#d4af37]/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#d4af37]/10">
            {review.user?.image ? (
              <img
                src={review.user.image}
                alt={review.user.name || "Customer"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={19} className="text-[#d4af37]" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              {review.user?.name || "ST Customer"}
            </h4>

            <p className="text-xs text-white/30">{date}</p>
          </div>
        </div>

        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              size={14}
              fill={value <= review.rating ? "currentColor" : "none"}
              className={
                value <= review.rating ? "text-[#d4af37]" : "text-white/15"
              }
            />
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-white/55">{review.comment}</p>
    </article>
  );
}

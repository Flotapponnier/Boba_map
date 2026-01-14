"use client";

import { useState, useEffect } from "react";
import type { Place } from "@/types";

interface PlaceReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date | null;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
}

interface PlaceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#3B82F6",
  food: "#F97316",
  event: "#8B5CF6",
  service: "#10B981",
  activity: "#EC4899",
  nightlife: "#EF4444",
  transport: "#6B7280",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  accommodation: "🏨",
  food: "🍜",
  event: "🎉",
  service: "💼",
  activity: "🎯",
  nightlife: "🌙",
  transport: "🚌",
};

export function PlaceReviewModal({
  isOpen,
  onClose,
  place,
  isLoggedIn,
  onLoginRequired,
}: PlaceReviewModalProps) {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Load reviews when place changes
  useEffect(() => {
    if (!isOpen || !place) return;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/reviews?name=${encodeURIComponent(place.name)}`
        );
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
          setAvgRating(data.rating);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [isOpen, place]);

  if (!isOpen || !place) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/places/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName: place.name,
          placeCategory: place.category,
          rating,
          comment: comment || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Refresh reviews
      const refreshRes = await fetch(
        `/api/places/reviews?name=${encodeURIComponent(place.name)}`
      );
      const refreshData = await refreshRes.json();
      if (refreshData.reviews) {
        setReviews(refreshData.reviews);
        setAvgRating(refreshData.rating);
      }

      setComment("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const color = CATEGORY_COLORS[place.category] || "#3B82F6";
  const emoji = CATEGORY_EMOJIS[place.category] || "📍";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with color */}
        <div
          className="p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            ✕
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{place.name}</h2>
              <p className="text-white/80 text-sm mt-1 capitalize">
                {place.category}
              </p>
            </div>
          </div>

          {/* Rating display */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    avgRating && star <= Math.round(avgRating)
                      ? "text-yellow-300"
                      : "text-white/40"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-white/80 text-sm">
              {avgRating ? `${avgRating.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 mb-4">{place.description}</p>

          {/* Details */}
          <div className="flex flex-wrap gap-3 mb-6">
            {place.address && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
                📍 {place.address}
              </span>
            )}
            {place.price !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full text-sm text-green-700 font-medium">
                {place.price === 0 ? "Free" : `${place.price}€`}
              </span>
            )}
          </div>

          {/* Existing reviews */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading reviews...
            </div>
          ) : reviews.length > 0 ? (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Community Reviews ({reviews.length})
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={review.user?.avatarUrl || "/avatars/golden.png"}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium text-sm text-gray-700">
                        {review.user?.username || "Anonymous"}
                      </span>
                      <div className="flex ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-gray-500">No reviews yet</p>
              <p className="text-sm text-gray-400">Be the first to share your experience!</p>
            </div>
          )}

          {/* Add review form */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Leave a Review</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl transition-transform hover:scale-110"
                    >
                      <span
                        className={
                          star <= (hoverRating || rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </>
                ) : isLoggedIn ? (
                  <>
                    <span>⭐</span>
                    Submit Review
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    Sign in to Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


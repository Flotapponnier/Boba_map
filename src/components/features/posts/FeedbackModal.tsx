"use client";

import { useState } from "react";
import type { PostWithFeedbacks } from "@/types";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithFeedbacks | null;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onFeedbackAdded: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#3B82F6",
  food: "#F97316",
  event: "#8B5CF6",
  service: "#10B981",
  activity: "#EC4899",
  nightlife: "#EF4444",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  accommodation: "🏨",
  food: "🍜",
  event: "🎉",
  service: "💼",
  activity: "🎯",
  nightlife: "🌙",
};

export function FeedbackModal({
  isOpen,
  onClose,
  post,
  isLoggedIn,
  onLoginRequired,
  onFeedbackAdded,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      onFeedbackAdded();
      setComment("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const color = CATEGORY_COLORS[post.category] || "#3B82F6";
  const emoji = CATEGORY_EMOJIS[post.category] || "📍";

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
              <h2 className="text-xl font-bold truncate">{post.title}</h2>
              <p className="text-white/80 text-sm mt-1">
                by {post.user?.username || "Anonymous"}
              </p>
            </div>
          </div>

          {/* Rating display */}
          {post.rating !== null && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(post.rating!) ? "text-yellow-300" : "text-white/40"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-white/80 text-sm">
                {post.rating.toFixed(1)} ({post.feedbackCount} reviews)
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 mb-4">{post.description}</p>

          {/* Event Details - only for events */}
          {post.category === "event" && (post.eventDate || post.eventTime || post.eventRecurrence) && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3">
                <span>📅</span> Event Details
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {post.eventDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🗓️</span>
                    <div>
                      <div className="text-gray-500 text-xs">Date</div>
                      <div className="font-medium text-gray-800">
                        {new Date(post.eventDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {post.eventTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🕐</span>
                    <div>
                      <div className="text-gray-500 text-xs">Time</div>
                      <div className="font-medium text-gray-800">{post.eventTime}</div>
                    </div>
                  </div>
                )}
                {post.eventRecurrence && post.eventRecurrence !== "once" && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-purple-500">🔄</span>
                    <div>
                      <div className="text-gray-500 text-xs">Frequency</div>
                      <div className="font-medium text-gray-800 capitalize">{post.eventRecurrence}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex flex-wrap gap-3 mb-6">
            {post.address && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
                📍 {post.address}
              </span>
            )}
            {post.price !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full text-sm text-green-700 font-medium">
                {post.price === 0 ? "Free" : `$${post.price}`}
              </span>
            )}
            {post.community && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                post.community.isPublic 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-purple-100 text-purple-700"
              }`}>
                {post.community.isPublic ? "🌍" : "🔒"} {post.community.name}
              </span>
            )}
          </div>

          {/* Existing feedbacks */}
          {post.feedbacks && post.feedbacks.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Reviews</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {post.feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={feedback.user?.avatarUrl || "/avatars/golden.png"}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium text-sm text-gray-700">
                        {feedback.user?.username || "Anonymous"}
                      </span>
                      <div className="flex ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= feedback.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-gray-600">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add feedback form */}
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
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
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


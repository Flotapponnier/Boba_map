"use client";

import Image from "next/image";
import { getAvatarByIndex, getFeedback, getBookingLink } from "@/constants/boba-feedback";
import type { Place } from "@/types";

interface BobaFeedbackProps {
  place: Place;
  index: number;
  showBookingLink?: boolean;
  compact?: boolean;
}

export function BobaFeedback({
  place,
  index,
  showBookingLink = true,
  compact = false,
}: BobaFeedbackProps) {
  const avatar = getAvatarByIndex(index);
  const feedback = getFeedback(place.category, place.price, index);
  const bookingLink = getBookingLink(place.name, place.category);

  if (compact) {
    return (
      <div className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
        <div className="relative w-8 h-8 shrink-0">
          <Image
            src={avatar.image}
            alt={avatar.name}
            fill
            className="object-contain rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 leading-tight">{feedback}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 shrink-0">
          <Image
            src={avatar.image}
            alt={avatar.name}
            fill
            className="object-contain drop-shadow-md"
          />
        </div>

        {/* Feedback content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-amber-800">
              {avatar.name}
            </span>
            <span className="text-xs text-amber-600">says:</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>

          {/* Rating visualization */}
          {place.rating && (
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.round(place.rating!) ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Booking link */}
      {showBookingLink && bookingLink && (
        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          {place.category === "accommodation"
            ? "Book on Booking.com"
            : place.category === "food"
              ? "See on TripAdvisor"
              : place.category === "event"
                ? "Join on Meetup"
                : "Learn more"}
        </a>
      )}
    </div>
  );
}



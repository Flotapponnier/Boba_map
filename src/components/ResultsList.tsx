"use client";

import { useEffect, useState, useRef } from "react";
import type { Place } from "@/types";
import { getAvatarByIndex, getFeedback, getBookingLink } from "@/constants/boba-feedback";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  accommodation: { bg: "bg-blue-50", text: "text-blue-600", icon: "🏨" },
  food: { bg: "bg-orange-50", text: "text-orange-600", icon: "🍽️" },
  event: { bg: "bg-purple-50", text: "text-purple-600", icon: "🎉" },
  service: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "💼" },
  activity: { bg: "bg-pink-50", text: "text-pink-600", icon: "🎯" },
  transport: { bg: "bg-stone-100", text: "text-stone-600", icon: "🚌" },
  nightlife: { bg: "bg-rose-50", text: "text-rose-600", icon: "🌙" },
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "Stay",
  food: "Food",
  event: "Event",
  service: "Service",
  activity: "Activity",
  transport: "Transport",
  nightlife: "Nightlife",
};

const BOOKING_LABELS: Record<string, string> = {
  accommodation: "Book now",
  food: "See reviews",
  event: "Join event",
  service: "Learn more",
  activity: "Sign up",
  nightlife: "See more",
};

interface ResultsListProps {
  places: Place[];
  selectedPlace?: Place;
  onPlaceClick: (place: Place) => void;
  currentHighlightIndex?: number;
  onReviewClick?: (place: Place) => void;
}

export function ResultsList({
  places,
  selectedPlace,
  onPlaceClick,
  currentHighlightIndex,
  onReviewClick,
}: ResultsListProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const prevPlacesRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate results appearing one by one
  useEffect(() => {
    const placesKey = places.map((p) => p.id).join(",");

    if (placesKey === prevPlacesRef.current) return;

    prevPlacesRef.current = placesKey;
    setVisibleCount(0);

    if (places.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];

    places.forEach((_, index) => {
      const timeout = setTimeout(
        () => {
          setVisibleCount(index + 1);
        },
        index * 1000 + 500
      );
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [places]);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (
      currentHighlightIndex !== undefined &&
      currentHighlightIndex >= 0 &&
      containerRef.current
    ) {
      const element = containerRef.current.children[
        currentHighlightIndex + 1
      ] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentHighlightIndex]);

  if (places.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4 animate-bubble">🧋</div>
        <p className="text-stone-500 font-medium">Search for something</p>
        <p className="text-sm text-stone-400 mt-1">
          Try "cheap hotel" or "best kebab"
        </p>
      </div>
    );
  }

  const visiblePlaces = places.slice(0, visibleCount);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        {visibleCount < places.length ? (
          <>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm text-stone-500">
              Finding places... <span className="text-amber-500 font-medium">{visibleCount}/{places.length}</span>
            </span>
          </>
        ) : (
          <span className="text-sm text-stone-500">
            Found <span className="text-amber-500 font-medium">{places.length}</span> result{places.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Result cards */}
      {visiblePlaces.map((place, index) => {
        const isHighlighted = currentHighlightIndex === index;
        const isSelected = selectedPlace?.id === place.id;
        const avatar = getAvatarByIndex(index);
        const feedback = getFeedback(place.category, place.price, index);
        const bookingLink = getBookingLink(place.name, place.category);
        const categoryStyle = CATEGORY_STYLES[place.category] || CATEGORY_STYLES.service;

        return (
          <div
            key={place.id}
            className={`rounded-3xl overflow-hidden transition-all duration-300 animate-slide-in ${
              isSelected
                ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100"
                : isHighlighted
                  ? "ring-2 ring-amber-300 shadow-md shadow-amber-50"
                  : "bg-white border border-amber-100/60 hover:border-amber-200 hover:shadow-md hover:shadow-amber-50"
            }`}
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            {/* Main content - clickable */}
            <div
              onClick={() => onPlaceClick(place)}
              className={`p-5 cursor-pointer transition-colors ${
                isSelected ? "bg-amber-50" : isHighlighted ? "bg-amber-50/50" : "bg-white hover:bg-amber-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category badge and rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                    >
                      <span>{categoryStyle.icon}</span>
                      {CATEGORY_LABELS[place.category] || place.category}
                    </span>
                    {place.rating && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <span>⭐</span>
                        {place.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-stone-800 text-lg leading-tight">
                    {place.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {place.description}
                  </p>

                  {/* Address */}
                  {place.address && (
                    <p className="flex items-center gap-1.5 text-xs text-stone-400 mt-3">
                      <span>📍</span>
                      <span className="truncate">{place.address}</span>
                    </p>
                  )}
                </div>

                {/* Price */}
                {place.price !== undefined && (
                  <div className="text-right shrink-0">
                    <span
                      className={`text-2xl font-bold ${
                        place.price === 0
                          ? "text-emerald-500"
                          : place.price < 50
                            ? "text-blue-500"
                            : "text-amber-500"
                      }`}
                    >
                      {place.price === 0 ? "Free" : `${place.price}€`}
                    </span>
                    {place.price > 0 && (
                      <p className="text-xs text-stone-400 mt-0.5">per night</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Boba feedback section - speech bubble style */}
            <div className="px-5 pb-5">
              <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100/50">
                {/* Speech bubble tail */}
                <div className="absolute -top-2 left-6 w-4 h-4 bg-gradient-to-br from-amber-50 to-orange-50 rotate-45 border-l border-t border-amber-100/50" />

                <div className="flex items-start gap-3 relative">
                  {/* Avatar */}
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="w-12 h-12 object-contain drop-shadow-sm shrink-0"
                  />

                  {/* Feedback */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-600 mb-1">
                      {avatar.name}
                    </p>
                    <p className="text-sm text-stone-600 leading-relaxed">{feedback}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
                {/* Review button */}
                {onReviewClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewClick(place);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-700 text-sm font-semibold rounded-xl transition-all border border-amber-200/50"
                  >
                    ⭐ Leave Review
                  </button>
                )}

                {/* Booking button */}
                {bookingLink && (
                  <a
                    href={bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-200/50 transition-all hover:shadow-lg hover:shadow-amber-300/50 active:scale-[0.98] ${onReviewClick ? 'flex-1' : 'w-full'}`}
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
                    {BOOKING_LABELS[place.category] || "Learn more"}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

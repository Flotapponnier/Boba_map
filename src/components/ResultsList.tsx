"use client";

import { useEffect, useState, useRef } from "react";
import type { Place } from "@/types";
import { getAvatarByIndex, getFeedback, getBookingLink } from "@/constants/boba-feedback";

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "bg-blue-100 text-blue-700",
  food: "bg-orange-100 text-orange-700",
  event: "bg-purple-100 text-purple-700",
  service: "bg-green-100 text-green-700",
  activity: "bg-pink-100 text-pink-700",
  transport: "bg-gray-100 text-gray-700",
  nightlife: "bg-red-100 text-red-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: "🏨 Stay",
  food: "🍽️ Food",
  event: "🎉 Event",
  service: "💼 Service",
  activity: "🎯 Activity",
  transport: "🚌 Transport",
  nightlife: "🌙 Nightlife",
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
}

export function ResultsList({
  places,
  selectedPlace,
  onPlaceClick,
  currentHighlightIndex,
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
      ); // Sync with map animation
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
      ] as HTMLElement; // +1 for the count text
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentHighlightIndex]);

  if (places.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Search for something to see results here</p>
      </div>
    );
  }

  const visiblePlaces = places.slice(0, visibleCount);

  return (
    <div ref={containerRef} className="space-y-4">
      <p className="text-sm text-gray-500">
        {visibleCount < places.length ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Finding places... ({visibleCount}/{places.length})
          </span>
        ) : (
          `Found ${places.length} result${places.length !== 1 ? "s" : ""}`
        )}
      </p>

      {visiblePlaces.map((place, index) => {
        const isHighlighted = currentHighlightIndex === index;
        const isSelected = selectedPlace?.id === place.id;
        const avatar = getAvatarByIndex(index);
        const feedback = getFeedback(place.category, place.price, index);
        const bookingLink = getBookingLink(place.name, place.category);

        return (
          <div
            key={place.id}
            className={`rounded-xl border overflow-hidden transition-all animate-slide-in ${
              isSelected
                ? "border-blue-500 bg-blue-50"
                : isHighlighted
                  ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Main content - clickable */}
            <div
              onClick={() => onPlaceClick(place)}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        CATEGORY_COLORS[place.category] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {CATEGORY_LABELS[place.category] || place.category}
                    </span>
                    {place.rating && (
                      <span className="text-xs text-yellow-600">
                        ⭐ {place.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    {place.name}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {place.description}
                  </p>

                  {place.address && (
                    <p className="text-xs text-gray-400 mt-2 truncate">
                      📍 {place.address}
                    </p>
                  )}
                </div>

                {place.price !== undefined && (
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xl font-bold ${
                        place.price === 0
                          ? "text-green-600"
                          : place.price < 50
                            ? "text-blue-600"
                            : "text-amber-600"
                      }`}
                    >
                      {place.price === 0 ? "Free" : `${place.price}€`}
                    </span>
                    {place.price > 0 && (
                      <p className="text-xs text-gray-400">per night</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Boba feedback section */}
            <div className="px-4 pb-4">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                {/* Avatar */}
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-10 h-10 object-contain drop-shadow-sm shrink-0"
                />

                {/* Feedback */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-700">
                    {avatar.name}
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5">{feedback}</p>
                </div>
              </div>

              {/* Booking button */}
              {bookingLink && (
                <a
                  href={bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
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
        );
      })}
    </div>
  );
}

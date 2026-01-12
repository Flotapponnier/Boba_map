"use client";

import { useEffect, useState, useRef } from "react";
import type { Place } from "@/types";

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
    <div ref={containerRef} className="space-y-3">
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

        return (
          <div
            key={place.id}
            onClick={() => onPlaceClick(place)}
            className={`p-4 rounded-lg border cursor-pointer transition-all animate-slide-in ${
              isSelected
                ? "border-blue-500 bg-blue-50"
                : isHighlighted
                  ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
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

                <h3 className="font-semibold text-gray-900 truncate">
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
                    className={`text-lg font-bold ${
                      place.price === 0 ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {place.price === 0 ? "Free" : `${place.price}€`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

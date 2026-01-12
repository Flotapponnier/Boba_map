"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SearchBar, ResultsList } from "@/components";
import { STUTTGART_PLACES } from "@/constants";
import { searchPlaces } from "@/utils";
import type { Place } from "@/types";

// Dynamic import for Map (Leaflet doesn't work with SSR)
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [results, setResults] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track which result is being shown in the sequence
  useEffect(() => {
    if (!isSearching || results.length === 0) {
      setCurrentHighlightIndex(-1);
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];

    results.forEach((_, index) => {
      const timeout = setTimeout(
        () => {
          setCurrentHighlightIndex(index);
        },
        index * 1000 + 500
      ); // Sync with map animation
      timeouts.push(timeout);
    });

    // Clear highlight after sequence
    const finalTimeout = setTimeout(
      () => {
        setCurrentHighlightIndex(-1);
      },
      results.length * 1000 + 2000
    );
    timeouts.push(finalTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isSearching, results]);

  const handleSearch = useCallback((query: string) => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    setLastQuery(query);
    setSelectedPlace(undefined);
    setCurrentHighlightIndex(-1);

    // Small delay to allow mascot animation to start
    searchTimeoutRef.current = setTimeout(() => {
      const searchResults = searchPlaces(STUTTGART_PLACES, query);
      setResults(searchResults);
    }, 100);
  }, []);

  const handleSearchAnimationComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
  }, []);

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      {/* Header with search */}
      <header className="shrink-0 p-4 border-b border-gray-100">
        <div className="max-w-3xl">
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            Boba
            <span className="text-sm font-normal text-gray-500 ml-2">
              Stuttgart
            </span>
          </h1>
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results sidebar */}
        <aside className="w-96 shrink-0 border-r border-gray-100 overflow-y-auto p-4">
          {lastQuery && (
            <p className="text-sm text-gray-400 mb-3">
              Results for: <span className="text-gray-600">"{lastQuery}"</span>
            </p>
          )}
          <ResultsList
            places={results}
            selectedPlace={selectedPlace}
            onPlaceClick={handlePlaceSelect}
            currentHighlightIndex={isSearching ? currentHighlightIndex : undefined}
          />
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            places={results}
            onPlaceSelect={handlePlaceSelect}
            isSearching={isSearching}
            onSearchAnimationComplete={handleSearchAnimationComplete}
          />
        </div>
      </div>
    </main>
  );
}

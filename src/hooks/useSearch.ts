"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchPlaces } from "@/utils";
import type { Place, PostWithUser } from "@/types";

interface UseSearchReturn {
  results: Place[];
  isSearching: boolean;
  lastQuery: string;
  currentHighlightIndex: number;
  handleSearch: (query: string) => void;
  handleSearchAnimationComplete: () => void;
  clearSearch: () => void;
}

/**
 * Convert posts to Place format for search
 */
function postsToPlaces(posts: PostWithUser[]): Place[] {
  return posts.map((post) => ({
    id: `post-${post.id}`,
    name: post.title,
    description: post.description,
    category: post.category as Place["category"],
    coordinates: { lat: post.lat, lng: post.lng },
    address: post.address || undefined,
    price: post.price || undefined,
    rating: post.rating || undefined,
    isUserPost: true,
    postData: post,
  }));
}

/**
 * Hook for managing search functionality
 */
export function useSearch(places: Place[], posts: PostWithUser[]): UseSearchReturn {
  const [results, setResults] = useState<Place[]>([]);
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
      );
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
    setCurrentHighlightIndex(-1);

    // Small delay to allow mascot animation to start
    searchTimeoutRef.current = setTimeout(() => {
      const userPostPlaces = postsToPlaces(posts);
      const searchResults = searchPlaces(places, query, userPostPlaces);
      setResults(searchResults);
    }, 100);
  }, [places, posts]);

  const handleSearchAnimationComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setLastQuery("");
    setCurrentHighlightIndex(-1);
  }, []);

  return {
    results,
    isSearching,
    lastQuery,
    currentHighlightIndex,
    handleSearch,
    handleSearchAnimationComplete,
    clearSearch,
  };
}

// Export helper for use in other components
export { postsToPlaces };


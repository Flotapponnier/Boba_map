"use client";

import { useState, useCallback, useEffect } from "react";
import type { Place } from "@/types";

interface UsePlacesReturn {
  places: Place[];
  isLoading: boolean;
  error: string | null;
  loadPlaces: () => Promise<void>;
}

/**
 * Hook for managing places data from database
 */
export function usePlaces(): UsePlacesReturn {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/places");
      const data = await res.json();
      if (data.places) {
        setPlaces(data.places);
      }
    } catch (err) {
      console.error("Failed to load places:", err);
      setError("Failed to load places");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load places on mount
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  return {
    places,
    isLoading,
    error,
    loadPlaces,
  };
}


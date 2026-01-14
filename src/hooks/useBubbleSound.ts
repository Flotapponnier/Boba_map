"use client";

import { useRef, useCallback } from "react";

/**
 * Hook to play bubble pop sound effect
 */
export function useBubbleSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/bubble_appear.wav");
      audioRef.current.volume = 0.5; // 50% volume
    }

    // Clone and play to allow overlapping sounds
    const sound = audioRef.current.cloneNode() as HTMLAudioElement;
    sound.volume = 0.4;
    sound.play().catch(() => {
      // Ignore autoplay errors (user hasn't interacted yet)
    });
  }, []);

  return { playSound };
}




"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";

interface UseAuthReturn {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

/**
 * Hook for managing authentication state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (isMounted && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to check auth:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  }, []);

  return {
    user,
    setUser,
    isLoggedIn: !!user,
    isLoading,
    logout,
  };
}


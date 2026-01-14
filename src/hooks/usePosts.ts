"use client";

import { useState, useCallback, useEffect } from "react";
import type { PostWithUser, PostWithFeedbacks } from "@/types";

interface UsePostsReturn {
  posts: PostWithUser[];
  isLoading: boolean;
  error: string | null;
  loadPosts: () => Promise<void>;
  getPostWithFeedbacks: (postId: number) => Promise<PostWithFeedbacks | null>;
}

/**
 * Hook for managing posts data
 */
export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPostWithFeedbacks = useCallback(async (postId: number): Promise<PostWithFeedbacks | null> => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      return data.post || null;
    } catch (err) {
      console.error("Failed to load post:", err);
      return null;
    }
  }, []);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    isLoading,
    error,
    loadPosts,
    getPostWithFeedbacks,
  };
}


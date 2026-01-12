"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SearchBar, ResultsList, AuthModal, CreatePostModal, UserMenu, FeedbackModal, PlaceReviewModal } from "@/components";
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

interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

interface PostWithUser {
  id: number;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  price: number | null;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  rating: number | null;
  feedbackCount: number;
}

export default function Home() {
  const [results, setResults] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null);
  
  // Place review state (for API places / search results)
  const [showPlaceReviewModal, setShowPlaceReviewModal] = useState(false);
  const [selectedPlaceForReview, setSelectedPlaceForReview] = useState<Place | null>(null);

  // Posts state
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
      // Convert user posts to Place format for search
      const userPostPlaces: Place[] = posts.map((post) => ({
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
      
      // Search both static places and user posts
      const searchResults = searchPlaces(STUTTGART_PLACES, query, userPostPlaces);
      setResults(searchResults);
    }, 100);
  }, [posts]);

  const handleSearchAnimationComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    // Open review modal for non-user-post places
    if (!place.isUserPost) {
      setSelectedPlaceForReview(place);
      setShowPlaceReviewModal(true);
    }
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedPosition({ lat, lng });
  }, []);

  const handlePostClick = async (post: PostWithUser) => {
    // Fetch full post details with feedbacks
    try {
      const res = await fetch(`/api/posts/${post.id}`);
      const data = await res.json();
      if (data.post) {
        setSelectedPost(data.post);
        setShowFeedbackModal(true);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedPosition(null);
    setIsSelectingPosition(false);
    setShowCreatePostModal(true);
  };

  // Convert posts to Place format for map
  const postPlaces: Place[] = posts.map((post) => ({
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

  // Combine search results with posts
  const allPlaces = lastQuery ? results : postPlaces;

  return (
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      {/* Header with search */}
      <header className="shrink-0 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 max-w-3xl">
            <h1 className="text-xl font-bold text-gray-900 mb-3">
              🧋 Boba
              <span className="text-sm font-normal text-gray-500 ml-2">
                Stuttgart
              </span>
            </h1>
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-3 pt-1">
            {user ? (
              <UserMenu
                user={user}
                onLogout={() => setUser(null)}
                onCreatePost={handleCreatePost}
              />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-full shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                <span>🧋</span>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results sidebar - hide when creating post */}
        <aside className={`w-96 shrink-0 border-r border-gray-100 overflow-y-auto p-4 transition-all ${showCreatePostModal ? 'hidden' : ''}`}>
          {/* Create post button */}
          {user && (
            <button
              onClick={handleCreatePost}
              className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-700 font-medium rounded-xl border-2 border-dashed border-amber-300 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">📍</span>
              Share a Place
            </button>
          )}

          {lastQuery ? (
            <>
              <p className="text-sm text-gray-400 mb-3">
                Results for: <span className="text-gray-600">"{lastQuery}"</span>
              </p>
              <ResultsList
                places={results}
                selectedPlace={selectedPlace}
                onPlaceClick={handlePlaceSelect}
                currentHighlightIndex={isSearching ? currentHighlightIndex : undefined}
                onReviewClick={(place) => {
                  setSelectedPlaceForReview(place);
                  setShowPlaceReviewModal(true);
                }}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-3">
                Community posts ({posts.length})
              </p>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🗺️</div>
                  <p className="text-gray-500">No posts yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Be the first to share a place!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={post.user?.avatarUrl || "/avatars/golden.png"}
                          alt=""
                          className="w-10 h-10 rounded-full bg-amber-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              by {post.user?.username || "Anonymous"}
                            </span>
                            {post.rating !== null && (
                              <span className="text-xs text-amber-500">
                                ★ {post.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Position selection indicator */}
          {isSelectingPosition && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse">
              <span>👆</span>
              Click on the map to select a position
            </div>
          )}

          <Map
            places={allPlaces}
            onPlaceSelect={handlePlaceSelect}
            isSearching={isSearching}
            onSearchAnimationComplete={handleSearchAnimationComplete}
            onMapClick={handleMapClick}
            isSelectingPosition={isSelectingPosition}
            selectedPosition={selectedPosition}
            onPostClick={handlePostClick}
          />
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setIsSelectingPosition(false);
          setSelectedPosition(null);
        }}
        onSuccess={() => {
          loadPosts();
          setIsSelectingPosition(false);
          setSelectedPosition(null);
        }}
        selectedPosition={selectedPosition}
        onRequestPosition={() => setIsSelectingPosition(true)}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        isLoggedIn={!!user}
        onLoginRequired={() => {
          setShowFeedbackModal(false);
          setShowAuthModal(true);
        }}
        onFeedbackAdded={() => {
          loadPosts();
          // Refresh the post details
          if (selectedPost) {
            fetch(`/api/posts/${selectedPost.id}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.post) {
                  setSelectedPost(data.post);
                }
              });
          }
        }}
      />

      <PlaceReviewModal
        isOpen={showPlaceReviewModal}
        onClose={() => {
          setShowPlaceReviewModal(false);
          setSelectedPlaceForReview(null);
        }}
        place={selectedPlaceForReview}
        isLoggedIn={!!user}
        onLoginRequired={() => {
          setShowPlaceReviewModal(false);
          setShowAuthModal(true);
        }}
      />
    </main>
  );
}

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

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <main className="h-screen w-screen flex flex-col overflow-hidden bg-[#FFFCF7] boba-pattern">
      {/* Header with search */}
      <header className="shrink-0 px-4 py-3 lg:px-6 lg:py-5 bg-gradient-to-b from-amber-50/80 to-transparent">
        {/* Top row: hamburger, logo, auth */}
        <div className="flex items-center justify-between gap-3 mb-3 lg:mb-4">
          {/* Hamburger menu - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-amber-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 flex-1 lg:flex-initial">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <span className="text-lg lg:text-xl">🧋</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-stone-800 tracking-tight">
                Boba
              </h1>
              <p className="text-xs text-stone-400 -mt-0.5 hidden sm:block">Stuttgart</p>
            </div>
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-2 lg:gap-3">
            {user ? (
              <UserMenu
                user={user}
                onLogout={() => setUser(null)}
                onCreatePost={handleCreatePost}
              />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-2 lg:px-5 lg:py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-sm lg:text-base font-semibold rounded-xl lg:rounded-2xl shadow-lg shadow-amber-200/60 transition-all flex items-center gap-1.5 lg:gap-2 hover:shadow-xl hover:shadow-amber-300/50 active:scale-[0.98]"
              >
                <span className="hidden sm:inline">🧋</span>
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Search bar row */}
        <div className="lg:max-w-3xl">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[998] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Results sidebar - slide-in on mobile */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-[999] w-[85vw] max-w-[400px]
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:relative lg:translate-x-0 lg:w-[400px] lg:z-auto
            bg-white lg:bg-white/60 backdrop-blur-sm border-r border-amber-100/50 overflow-y-auto
            ${showCreatePostModal ? 'hidden' : ''}
          `}
        >
          {/* Mobile sidebar header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-amber-100/50 p-4 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧋</span>
              <span className="font-bold text-stone-800">Results</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-amber-100 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 lg:p-5">
          {/* Create post button */}
          {user && (
            <button
              onClick={handleCreatePost}
              className="w-full mb-5 py-3.5 px-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 font-semibold rounded-2xl border-2 border-dashed border-amber-200 hover:border-amber-300 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📍</span>
              Share a Place
            </button>
          )}

          {lastQuery ? (
            <>
              <p className="text-sm text-stone-400 mb-4">
                Results for: <span className="text-stone-600 font-medium">"{lastQuery}"</span>
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
              <p className="text-sm text-stone-400 mb-4">
                Community posts <span className="text-amber-500 font-medium">({posts.length})</span>
              </p>
              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4 animate-bubble">🗺️</div>
                  <p className="text-stone-600 font-medium">No posts yet</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Be the first to share a place!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="w-full text-left p-4 rounded-2xl bg-white border border-amber-100 hover:border-amber-200 hover:shadow-md hover:shadow-amber-100/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={post.user?.avatarUrl || "/avatars/golden.png"}
                          alt=""
                          className="w-11 h-11 rounded-xl bg-amber-50 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-700 truncate group-hover:text-amber-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-stone-500 truncate">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-stone-400">
                              by {post.user?.username || "Anonymous"}
                            </span>
                            {post.rating !== null && (
                              <span className="text-xs text-amber-500 font-medium">
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
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Position selection indicator */}
          {isSelectingPosition && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium rounded-2xl shadow-xl shadow-amber-300/40 flex items-center gap-2 animate-pulse">
              <span className="text-lg">👆</span>
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

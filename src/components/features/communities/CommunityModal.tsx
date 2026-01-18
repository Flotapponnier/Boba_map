"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { User } from "@/types";

interface Community {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  creator: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  isMember: boolean;
  userRole: string | null;
  hasPendingRequest: boolean;
}

interface JoinRequest {
  id: number;
  userId: number;
  message: string | null;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
}

interface CommunityPost {
  id: number;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  rating: number | null;
  feedbackCount: number;
}

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function CommunityModal({ isOpen, onClose, user }: CommunityModalProps) {
  const [tab, setTab] = useState<"browse" | "my" | "create" | "manage" | "view">("browse");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);

  // Manage requests
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);

  // Community posts
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  const loadCommunities = useCallback(async (search?: string, myOnly?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (myOnly) params.set("my", "true");

      const res = await fetch(`/api/communities?${params}`);
      const data = await res.json();

      if (data.communities) {
        setCommunities(data.communities);
      }
    } catch (err) {
      setError("Failed to load communities");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCommunities(undefined, tab === "my");
    }
  }, [isOpen, tab, loadCommunities]);

  const handleSearch = () => {
    loadCommunities(searchQuery, tab === "my");
  };

  const handleJoin = async (community: Community) => {
    if (!user) {
      setError("Please sign in to join communities");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join");
      }

      setSuccess(data.message);
      loadCommunities(searchQuery, tab === "my");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (community: Community) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to leave");
      }

      setSuccess("Left the community");
      loadCommunities(searchQuery, tab === "my");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      setError("Please sign in to create communities");
      return;
    }

    if (!newName.trim()) {
      setError("Community name is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          isPublic: newIsPublic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create");
      }

      setSuccess(`Community "${data.community.name}" created!`);
      setNewName("");
      setNewDescription("");
      setNewIsPublic(true);
      setTab("my");
      loadCommunities(undefined, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (community: Community) => {
    setSelectedCommunity(community);
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${community.id}/requests`);
      const data = await res.json();
      if (data.requests) {
        setPendingRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewCommunityPosts = async (community: Community) => {
    setSelectedCommunity(community);
    setTab("view");
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?communityId=${community.id}`);
      const data = await res.json();
      if (data.posts) {
        setCommunityPosts(data.posts);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load community posts");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: number, action: "accept" | "reject") => {
    if (!selectedCommunity) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${selectedCommunity.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess(data.message);
      loadRequests(selectedCommunity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-stone-900/30 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-md bg-gradient-to-b from-purple-50 to-white shadow-2xl flex flex-col transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0 opacity-100 visible" : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="relative shrink-0 px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="absolute top-3 left-6 w-3 h-3 rounded-full bg-white/20" />
          <div className="absolute top-6 left-12 w-2 h-2 rounded-full bg-white/15" />
          <div className="absolute bottom-4 right-16 w-4 h-4 rounded-full bg-white/10" />
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">👥</span> Communities
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-purple-100/50 shrink-0">
          {[
            { id: "browse", label: "🔍 Browse", show: true },
            { id: "my", label: "⭐ My", show: !!user },
            { id: "create", label: "➕ Create", show: !!user },
            { id: "manage", label: "⚙️ Manage", show: !!user },
          ]
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id as typeof tab);
                  setSelectedCommunity(null);
                }}
                className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
                  tab === t.id
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-purple-600/70 hover:text-purple-700 hover:bg-white/50"
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Browse / My Communities Tab */}
          {(tab === "browse" || tab === "my") && (
            <>
              {/* Search */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search communities..."
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-purple-100 bg-purple-50/30 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Communities List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : communities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {tab === "my" ? "You haven't joined any communities yet" : "No communities found"}
                </div>
              ) : (
                <div className="space-y-3">
                  {communities.map((community) => (
                    <div
                      key={community.id}
                      className="p-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-xl border border-purple-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">{community.name}</h3>
                            {!community.isPublic && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                🔒 Private
                              </span>
                            )}
                          </div>
                          {community.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {community.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>👥 {community.memberCount} members</span>
                            {community.creator && (
                              <span>Created by @{community.creator.username}</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                          {community.isMember ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  ✓ {community.userRole === "admin" ? "Admin" : "Member"}
                                </span>
                                {community.userRole !== "admin" && (
                                  <button
                                    onClick={() => handleLeave(community)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-full transition-colors"
                                  >
                                    Leave
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => viewCommunityPosts(community)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-full transition-colors"
                              >
                                📋 View Posts
                              </button>
                            </>
                          ) : community.hasPendingRequest ? (
                            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              ⏳ Pending
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleJoin(community)}
                                disabled={loading}
                                className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
                              >
                                {community.isPublic ? "Join" : "Request to Join"}
                              </button>
                              {community.isPublic && (
                                <button
                                  onClick={() => viewCommunityPosts(community)}
                                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-full transition-colors"
                                >
                                  📋 View Posts
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Create Tab */}
          {tab === "create" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., ETH Denver Builders"
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-purple-50/30 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What's your community about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-purple-50/30 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewIsPublic(true)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      newIsPublic
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200"
                    }`}
                  >
                    <div className="text-2xl mb-1">🌍</div>
                    <div className="font-medium text-gray-800">Public</div>
                    <div className="text-xs text-gray-500">Anyone can join</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIsPublic(false)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      !newIsPublic
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200"
                    }`}
                  >
                    <div className="text-2xl mb-1">🔒</div>
                    <div className="font-medium text-gray-800">Private</div>
                    <div className="text-xs text-gray-500">Approval required</div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !newName.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Community"}
              </button>
            </div>
          )}

          {/* Manage Tab */}
          {tab === "manage" && (
            <>
              {!selectedCommunity ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Select a community you admin to manage join requests
                  </p>
                  {communities
                    .filter((c) => c.userRole === "admin")
                    .map((community) => (
                      <button
                        key={community.id}
                        onClick={() => loadRequests(community)}
                        className="w-full p-4 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-xl border border-purple-100 text-left hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{community.name}</h3>
                            <p className="text-xs text-gray-500">
                              {community.memberCount} members • {community.isPublic ? "Public" : "Private"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  {communities.filter((c) => c.userRole === "admin").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      You don&apos;t admin any communities yet
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setSelectedCommunity(null)}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to communities
                  </button>

                  <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Pending Requests for {selectedCommunity.name}
                  </h3>

                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No pending requests 🎉
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 bg-amber-50 rounded-xl border border-amber-200"
                        >
                          <div className="flex items-center gap-3">
                            {req.user?.avatarUrl ? (
                              <Image
                                src={req.user.avatarUrl}
                                alt={req.user.username}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                                👤
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                @{req.user?.username || "Unknown"}
                              </p>
                              {req.message && (
                                <p className="text-sm text-gray-600 mt-1">&quot;{req.message}&quot;</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRequest(req.id, "accept")}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRequest(req.id, "reject")}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* View Community Posts Tab */}
          {tab === "view" && selectedCommunity && (
            <div>
              <button
                onClick={() => {
                  setSelectedCommunity(null);
                  setTab("browse");
                }}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to communities
              </button>

              {/* Community header */}
              <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {selectedCommunity.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{selectedCommunity.name}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedCommunity.isPublic ? "🌍 Public" : "🔒 Private"} • {selectedCommunity.memberCount} members
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-gray-700 mb-3">📋 Community Posts</h4>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading posts...</div>
              ) : communityPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500">No posts in this community yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to share something!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-white rounded-xl border border-purple-100 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {post.user?.avatarUrl ? (
                          <Image
                            src={post.user.avatarUrl}
                            alt={post.user.username}
                            width={40}
                            height={40}
                            className="rounded-xl"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            👤
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{post.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>by @{post.user?.username || "Unknown"}</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                              {post.category}
                            </span>
                            {post.rating !== null && (
                              <span className="text-amber-500 font-medium">★ {post.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


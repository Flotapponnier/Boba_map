"use client";

import { useState, useEffect } from "react";
import type { Coordinates } from "@/types";

interface UserCommunity {
  id: number;
  name: string;
  isPublic: boolean;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPosition: Coordinates | null;
  onRequestPosition: () => void;
}

const CATEGORIES = [
  { id: "food", label: "Food & Drinks", emoji: "🍜" },
  { id: "accommodation", label: "Accommodation", emoji: "🏨" },
  { id: "activity", label: "Activity", emoji: "🎯" },
  { id: "event", label: "Event", emoji: "🎉" },
  { id: "nightlife", label: "Nightlife", emoji: "🌙" },
  { id: "service", label: "Service", emoji: "💼" },
];

export function CreatePostModal({ isOpen, onClose, onSuccess, selectedPosition, onRequestPosition }: CreatePostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  
  // Event-specific fields
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventRecurrence, setEventRecurrence] = useState<"once" | "daily" | "weekly" | "monthly">("once");
  
  // Community selector
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Load user's communities when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingCommunities(true);
      fetch("/api/communities?my=true")
        .then((res) => res.json())
        .then((data) => {
          if (data.communities) {
            setCommunities(data.communities.map((c: { id: number; name: string; isPublic: boolean }) => ({
              id: c.id,
              name: c.name,
              isPublic: c.isPublic,
            })));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCommunities(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPosition) {
      setError("Please select a position on the map first");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        lat: selectedPosition.lat,
        lng: selectedPosition.lng,
        address: address.trim() || null,
        price: price ? parseFloat(price) : null,
        communityId: selectedCommunityId,
        // Event fields (only sent if category is event)
        eventDate: category === "event" && eventDate ? eventDate : null,
        eventTime: category === "event" && eventTime ? eventTime : null,
        eventRecurrence: category === "event" ? eventRecurrence : null,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      onSuccess();
      onClose();
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("food");
      setAddress("");
      setPrice("");
      setSelectedCommunityId(null);
      setEventDate("");
      setEventTime("");
      setEventRecurrence("once");
    } catch (err) {
      console.error("Create post error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed left-0 top-0 bottom-0 z-[9999] w-96 bg-gradient-to-br from-amber-50 to-orange-50 shadow-2xl overflow-y-auto border-r-4 border-amber-400"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      {/* Header decoration */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all shadow-md z-10"
      >
        ✕
      </button>

      <div className="p-6 pt-10">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-3">
            <span className="text-2xl">📍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Share a Place</h2>
          <p className="text-gray-500 mt-1">Help others discover amazing spots!</p>
        </div>

        {/* Position selection - BIG BUTTON */}
        <div className="mb-6">
          {selectedPosition ? (
            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-green-700">Position selected!</div>
                  <div className="text-xs text-green-600">
                    {selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onRequestPosition}
                className="mt-3 w-full py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-colors"
              >
                Change position
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestPosition}
              className="w-full p-4 bg-amber-100 hover:bg-amber-200 border-2 border-dashed border-amber-400 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                  📍
                </div>
                <div className="text-left">
                  <div className="font-semibold text-amber-800">Pick location on map</div>
                  <div className="text-sm text-amber-600">Click here, then click on the map</div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl border-2 transition-all text-center ${
                    category === cat.id
                      ? "border-amber-400 bg-amber-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-amber-200"
                  }`}
                >
                  <span className="text-lg block">{cat.emoji}</span>
                  <span className="text-[10px] font-medium text-gray-700">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event-specific fields */}
          {category === "event" && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-medium text-sm">
                <span>🎉</span> Event Details
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Frequency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "once", label: "Once", emoji: "1️⃣" },
                    { id: "daily", label: "Daily", emoji: "📅" },
                    { id: "weekly", label: "Weekly", emoji: "🔄" },
                    { id: "monthly", label: "Monthly", emoji: "📆" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEventRecurrence(opt.id as "once" | "daily" | "weekly" | "monthly")}
                      className={`p-2 rounded-lg border transition-all text-center ${
                        eventRecurrence === opt.id
                          ? "border-purple-400 bg-purple-100"
                          : "border-purple-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <span className="text-sm block">{opt.emoji}</span>
                      <span className="text-[9px] font-medium text-gray-600">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Community selector */}
          {communities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post to Community (optional)
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedCommunityId(null)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                    selectedCommunityId === null
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-200 bg-white hover:border-amber-200"
                  }`}
                >
                  <span className="text-lg">🌍</span>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">Public (Everyone)</div>
                    <div className="text-xs text-gray-500">Visible to all users</div>
                  </div>
                </button>
                
                {loadingCommunities ? (
                  <div className="text-center py-2 text-gray-400 text-sm">Loading communities...</div>
                ) : (
                  communities.map((community) => (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() => setSelectedCommunityId(community.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                        selectedCommunityId === community.id
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-200 bg-white hover:border-purple-200"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm truncate">{community.name}</div>
                        <div className="text-xs text-gray-500">
                          {community.isPublic ? "🌍 Public community" : "🔒 Private - Members only"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Best coffee in town!"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us why this place is special..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-400 resize-none text-sm"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Address (optional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Price in € (optional)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 for free"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Posting...
              </>
            ) : (
              <>
                <span>🚀</span>
                Share this Place
              </>
            )}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition-all"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import Image from "next/image";

// Available Boba avatars
const AVATARS = [
  { id: "golden", name: "Golden Boba", path: "/avatars/golden.png" },
  { id: "pinky", name: "Pinky Boba", path: "/avatars/pinky.png" },
  { id: "black", name: "Black Boba", path: "/avatars/black.png" },
  { id: "diamond", name: "Diamond Boba", path: "/avatars/diamond.png" },
  { id: "smart", name: "Smart Boba", path: "/avatars/smart.png" },
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: number; username: string; email: string; avatarUrl: string | null }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);

  const selectedAvatar = AVATARS[selectedAvatarIndex];

  const handlePrevAvatar = () => {
    setSelectedAvatarIndex((prev) => (prev === 0 ? AVATARS.length - 1 : prev - 1));
  };

  const handleNextAvatar = () => {
    setSelectedAvatarIndex((prev) => (prev === AVATARS.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login"
        ? { email, password }
        : { username, email, password, avatarUrl: selectedAvatar.path };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onSuccess(data.user);
      onClose();

      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Decorative header with boba illustration */}
        <div className="relative h-32 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 overflow-hidden">
          {/* Bubble decorations */}
          <div className="absolute top-4 left-8 w-6 h-6 rounded-full bg-amber-200/60" />
          <div className="absolute top-12 left-16 w-4 h-4 rounded-full bg-orange-200/60" />
          <div className="absolute top-6 right-12 w-8 h-8 rounded-full bg-amber-200/40" />
          <div className="absolute bottom-8 right-8 w-5 h-5 rounded-full bg-orange-200/50" />

          {/* Boba cup */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-200">
              <span className="text-4xl">🧋</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-stone-400 hover:text-stone-600 transition-all shadow-sm hover:shadow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 pt-14">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-stone-800">
              {mode === "login" ? "Welcome back!" : "Join Boba Map"}
            </h2>
            <p className="text-stone-500 mt-2">
              {mode === "login"
                ? "Sign in to share your discoveries"
                : "Create an account to start posting"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-sm flex items-center gap-3">
              <span className="text-lg">😅</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <>
                {/* Avatar Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-stone-600 mb-3 text-center">
                    Choose your Boba avatar
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    {/* Left Arrow */}
                    <button
                      type="button"
                      onClick={handlePrevAvatar}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 hover:text-amber-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Avatar Display */}
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 p-1 shadow-xl shadow-amber-200/50 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src={selectedAvatar.path}
                            alt={selectedAvatar.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <span className="mt-2 text-sm font-medium text-amber-600">
                        {selectedAvatar.name}
                      </span>
                      <span className="text-xs text-stone-400">
                        {selectedAvatarIndex + 1} / {AVATARS.length}
                      </span>
                    </div>

                    {/* Right Arrow */}
                    <button
                      type="button"
                      onClick={handleNextAvatar}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 hover:text-amber-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-600 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="boba_lover"
                    required
                    minLength={3}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-100 bg-amber-50/30 focus:border-amber-300 focus:ring-4 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-100 bg-amber-50/30 focus:border-amber-300 focus:ring-4 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-100 bg-amber-50/30 focus:border-amber-300 focus:ring-4 focus:ring-amber-100 outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-200/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-300/50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  <span className="text-lg">🧋</span>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-8 text-center">
            <p className="text-stone-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="ml-2 text-amber-500 hover:text-amber-600 font-semibold transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



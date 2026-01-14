"use client";

import { useState, useRef, useEffect } from "react";
import type { User } from "@/types";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onCreatePost: () => void;
}

export function UserMenu({ user, onLogout, onCreatePost }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white hover:bg-amber-50 shadow-md shadow-amber-100/50 transition-all border border-amber-100 hover:border-amber-200 group"
      >
        <img
          src={user.avatarUrl || "/avatars/golden.png"}
          alt={user.username}
          className="w-9 h-9 rounded-xl object-contain bg-amber-50 group-hover:scale-105 transition-transform"
        />
        <span className="font-semibold text-stone-700 hidden sm:block">{user.username}</span>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl shadow-amber-100/50 border border-amber-100 overflow-hidden z-[9999] animate-fade-in">
          {/* User info header */}
          <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl || "/avatars/golden.png"}
                alt={user.username}
                className="w-12 h-12 rounded-xl object-contain bg-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-800 truncate">{user.username}</p>
                <p className="text-sm text-stone-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={() => {
                onCreatePost();
                setIsOpen(false);
              }}
              className="w-full px-5 py-3 text-left hover:bg-amber-50 flex items-center gap-3 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📍</span>
              <span className="text-stone-700 font-medium">Share a Place</span>
            </button>

            <button
              onClick={() => {
                // TODO: View my posts
                setIsOpen(false);
              }}
              className="w-full px-5 py-3 text-left hover:bg-amber-50 flex items-center gap-3 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">📋</span>
              <span className="text-stone-700 font-medium">My Posts</span>
            </button>

            <div className="border-t border-amber-100 my-2 mx-4" />

            <button
              onClick={handleLogout}
              className="w-full px-5 py-3 text-left hover:bg-rose-50 flex items-center gap-3 transition-colors group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">👋</span>
              <span className="text-rose-600 font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


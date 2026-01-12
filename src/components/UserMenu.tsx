"use client";

import { useState, useRef, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
}

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
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all border border-amber-200"
      >
        <img
          src={user.avatarUrl || "/avatars/golden.png"}
          alt={user.username}
          className="w-8 h-8 rounded-full object-contain bg-amber-50"
        />
        <span className="font-medium text-gray-700 hidden sm:block">{user.username}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <p className="font-semibold text-gray-800">{user.username}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={() => {
                onCreatePost();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-amber-50 flex items-center gap-3 transition-colors"
            >
              <span className="text-lg">📍</span>
              <span className="text-gray-700">Share a Place</span>
            </button>
            
            <button
              onClick={() => {
                // TODO: View my posts
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-amber-50 flex items-center gap-3 transition-colors"
            >
              <span className="text-lg">📋</span>
              <span className="text-gray-700">My Posts</span>
            </button>

            <div className="border-t border-gray-100 my-2" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
            >
              <span className="text-lg">👋</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useCallback } from "react";
import { BobaMascot } from "@/components/BobaMascot";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_QUERIES = [
  "cheap hotel",
  "best kebab",
  "bitcoin event",
  "learn music",
  "cozy bar",
  "coworking",
];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleExampleClick = useCallback(
    (example: string) => {
      setQuery(example);
      onSearch(example);
    },
    [onSearch]
  );

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Main search form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Search input with boba icon */}
          <div className="relative flex-1">
            <div className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-lg lg:text-xl pointer-events-none">
              🧋
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 bg-white border-2 border-amber-100 rounded-xl lg:rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100 transition-all text-sm lg:text-base shadow-sm"
              disabled={isLoading}
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-sm lg:text-base font-semibold rounded-xl lg:rounded-2xl shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all hover:shadow-xl hover:shadow-amber-300/40 active:scale-[0.98]"
          >
            Search
          </button>

          {/* Boba Mascot - hidden on small screens */}
          <div className="hidden sm:block">
            <BobaMascot isSearching={isLoading ?? false} size={48} />
          </div>
        </div>
      </form>

      {/* Example queries as floating bubbles - horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs lg:text-sm text-stone-400 shrink-0">Try:</span>
        {EXAMPLE_QUERIES.map((example, index) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            className="px-2.5 lg:px-3 py-1 lg:py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs lg:text-sm rounded-full border border-amber-200/60 transition-all disabled:opacity-50 hover:scale-105 hover:shadow-sm whitespace-nowrap shrink-0"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}


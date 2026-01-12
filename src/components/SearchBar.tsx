"use client";

import { useState, useCallback } from "react";
import { BobaMascot } from "./BobaMascot";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_QUERIES = [
  "i want a cheap hotel",
  "i want an expensive hotel",
  "where to eat a good kebab",
  "bitcoin event",
  "i want to learn music",
  "best bar in town",
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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything... e.g., 'where to eat a good kebab'"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Search
        </button>

        {/* Boba Mascot - appears after the search button */}
        <BobaMascot isSearching={isLoading ?? false} size={48} />
      </form>

      {/* Example queries */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">Try:</span>
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

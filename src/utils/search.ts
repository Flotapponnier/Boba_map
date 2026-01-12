import type { Place, PlaceCategory } from "@/types";
import { getCheapHotels, getExpensiveHotels } from "@/constants/hotels";

/**
 * Keywords mapping for query matching
 */
const CATEGORY_KEYWORDS: Record<PlaceCategory, string[]> = {
  accommodation: ["hostel", "hotel", "sleep", "stay", "room", "bed", "night", "accommodation", "lodge"],
  food: ["eat", "food", "restaurant", "kebab", "döner", "pizza", "burger", "cafe", "coffee", "breakfast", "lunch", "dinner"],
  event: ["event", "meetup", "concert", "festival", "party", "conference", "bitcoin", "crypto", "blockchain", "ethereum"],
  service: ["coworking", "library", "wifi", "work", "study", "office", "freelancer"],
  activity: ["learn", "music", "sport", "gym", "yoga", "dance", "class", "lesson", "course"],
  transport: ["bus", "train", "metro", "bike", "car", "taxi", "uber"],
  nightlife: ["bar", "club", "drink", "cocktail", "beer", "wine", "party", "night", "techno", "disco", "dj", "rave"],
};

/**
 * Keywords for cheap/expensive detection
 */
const CHEAP_KEYWORDS = ["cheap", "budget", "affordable", "low cost", "inexpensive", "pas cher", "economique"];
const EXPENSIVE_KEYWORDS = ["expensive", "luxury", "premium", "high end", "fancy", "luxe", "cher", "5 star", "5-star"];

/**
 * Detect if query is asking for cheap options
 */
function isAskingForCheap(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return CHEAP_KEYWORDS.some((keyword) => lowerQuery.includes(keyword));
}

/**
 * Detect if query is asking for expensive options
 */
function isAskingForExpensive(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return EXPENSIVE_KEYWORDS.some((keyword) => lowerQuery.includes(keyword));
}

/**
 * Detect if query is about hotels
 */
function isAskingForHotel(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  const hotelKeywords = ["hotel", "hostel", "stay", "sleep", "room", "accommodation", "lodge", "night"];
  return hotelKeywords.some((keyword) => lowerQuery.includes(keyword));
}

/**
 * Extract price limit from query (e.g., "less than 10 euros" -> 10)
 */
function extractPriceLimit(query: string): number | undefined {
  const patterns = [
    /less than (\d+)/i,
    /under (\d+)/i,
    /below (\d+)/i,
    /moins de (\d+)/i,
    /max (\d+)/i,
    /(\d+)\s*(?:€|euros?|eur)/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return undefined;
}

/**
 * Detect category from query keywords
 */
function detectCategory(query: string): PlaceCategory | undefined {
  const lowerQuery = query.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return category as PlaceCategory;
    }
  }
  return undefined;
}

/**
 * Calculate relevance score for a place based on query
 */
function calculateRelevance(place: Place, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Check name match
  if (place.name.toLowerCase().includes(lowerQuery)) {
    score += 10;
  }

  // Check description match
  const queryWords = lowerQuery.split(/\s+/);
  for (const word of queryWords) {
    if (word.length < 3) continue;

    if (place.name.toLowerCase().includes(word)) score += 5;
    if (place.description.toLowerCase().includes(word)) score += 3;
    if (place.tags?.some((tag) => tag.includes(word))) score += 4;
  }

  // Boost by rating
  if (place.rating) {
    score += place.rating;
  }

  return score;
}

/**
 * Search places based on natural language query
 * Handles special cases for cheap/expensive hotels
 */
export function searchPlaces(places: Place[], query: string, userPosts: Place[] = []): Place[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length >= 2);

  // Special handling for hotel queries with cheap/expensive
  if (isAskingForHotel(lowerQuery)) {
    if (isAskingForCheap(lowerQuery)) {
      // Return 5 cheap hotels
      return getCheapHotels().slice(0, 5);
    }
    if (isAskingForExpensive(lowerQuery)) {
      // Return 5 expensive hotels
      return getExpensiveHotels().slice(0, 5);
    }
  }

  const priceLimit = extractPriceLimit(query);
  const category = detectCategory(query);

  // Filter static places
  let results = places.filter((place) => {
    // Category filter
    if (category && place.category !== category) {
      // Allow some cross-category matches for relevant keywords
      const hasRelevantTag = place.tags?.some((tag) =>
        lowerQuery.includes(tag)
      );
      if (!hasRelevantTag) return false;
    }

    // Price filter
    if (priceLimit !== undefined && place.price !== undefined) {
      if (place.price > priceLimit) return false;
    }

    // At least some keyword match
    const hasMatch =
      queryWords.length === 0 ||
      queryWords.some(
        (word) =>
          place.name.toLowerCase().includes(word) ||
          place.description.toLowerCase().includes(word) ||
          (place.tags?.some((tag) => tag.includes(word)) ?? false)
      );

    return hasMatch;
  });

  // Filter user posts - match any word in title or description
  // More permissive matching for user-created content
  const matchingUserPosts = userPosts.filter((post) => {
    const titleLower = post.name.toLowerCase();
    const descLower = post.description.toLowerCase();
    const categoryLower = post.category.toLowerCase();
    const addressLower = (post.address || "").toLowerCase();

    // Also check category keywords
    if (category && post.category === category) {
      return true;
    }

    // Check if any query word matches title, description, category or address
    // Use partial matching (word can be part of a larger word)
    for (const word of queryWords) {
      if (
        titleLower.includes(word) ||
        descLower.includes(word) ||
        categoryLower.includes(word) ||
        addressLower.includes(word)
      ) {
        return true;
      }
    }

    // Also check if the full query matches anywhere
    if (
      titleLower.includes(lowerQuery) ||
      descLower.includes(lowerQuery)
    ) {
      return true;
    }

    return false;
  });

  // Combine results
  const allResults = [...results, ...matchingUserPosts];

  // Sort by relevance
  const sortedResults = allResults
    .map((place) => ({
      place,
      relevance: calculateRelevance(place, query),
    }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ place }) => place);

  // Remove duplicates (by id)
  const seen = new Set<string>();
  const uniqueResults = sortedResults.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });

  return uniqueResults;
}

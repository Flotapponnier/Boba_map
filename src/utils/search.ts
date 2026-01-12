import type { Place, PlaceCategory } from "@/types";

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
  nightlife: ["bar", "club", "drink", "cocktail", "beer", "wine", "party", "night"],
};

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
    if (place.tags.some((tag) => tag.includes(word))) score += 4;
  }

  // Boost by rating
  if (place.rating) {
    score += place.rating;
  }

  return score;
}

/**
 * Search places based on natural language query
 */
export function searchPlaces(places: Place[], query: string): Place[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const priceLimit = extractPriceLimit(query);
  const category = detectCategory(query);

  // Filter places
  let results = places.filter((place) => {
    // Category filter
    if (category && place.category !== category) {
      // Allow some cross-category matches for relevant keywords
      const hasRelevantTag = place.tags.some((tag) =>
        lowerQuery.includes(tag)
      );
      if (!hasRelevantTag) return false;
    }

    // Price filter
    if (priceLimit !== undefined && place.price !== undefined) {
      if (place.price > priceLimit) return false;
    }

    // At least some keyword match
    const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length >= 3);
    const hasMatch =
      queryWords.length === 0 ||
      queryWords.some(
        (word) =>
          place.name.toLowerCase().includes(word) ||
          place.description.toLowerCase().includes(word) ||
          place.tags.some((tag) => tag.includes(word))
      );

    return hasMatch;
  });

  // Sort by relevance
  results = results
    .map((place) => ({
      place,
      relevance: calculateRelevance(place, query),
    }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ place }) => place);

  return results;
}


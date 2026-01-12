import { NextRequest, NextResponse } from "next/server";
import { STUTTGART_PLACES } from "@/constants/places";
import type { PlaceCategory } from "@/types";

/**
 * GET /api/places
 * Returns static places data for frontend consumption
 *
 * Query params (all optional):
 * - category: Filter by category (e.g., "food", "accommodation")
 * - maxPrice: Maximum price filter
 * - limit: Limit number of results
 *
 * This endpoint serves static data from constants.
 * Backend can later swap this for database queries without frontend changes.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get("category") as PlaceCategory | null;
  const maxPrice = searchParams.get("maxPrice");
  const limit = searchParams.get("limit");

  // Start with all places
  let places = [...STUTTGART_PLACES];

  // Filter by category if provided
  if (category) {
    const validCategories: PlaceCategory[] = [
      "accommodation",
      "food",
      "event",
      "service",
      "activity",
      "transport",
      "nightlife",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category: ${category}. Valid: ${validCategories.join(", ")}`,
        },
        { status: 400 }
      );
    }

    places = places.filter((p) => p.category === category);
  }

  // Filter by max price if provided
  if (maxPrice) {
    const maxPriceNum = parseInt(maxPrice, 10);
    if (isNaN(maxPriceNum) || maxPriceNum < 0) {
      return NextResponse.json(
        { error: "maxPrice must be a positive number" },
        { status: 400 }
      );
    }
    places = places.filter(
      (p) => p.price === undefined || p.price <= maxPriceNum
    );
  }

  // Apply limit if provided
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      return NextResponse.json(
        { error: "limit must be a positive number" },
        { status: 400 }
      );
    }
    places = places.slice(0, limitNum);
  }

  return NextResponse.json({
    count: places.length,
    places,
  });
}

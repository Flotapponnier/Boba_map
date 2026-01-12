import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { places } from "@/db/schema";
import { eq, lte, and } from "drizzle-orm";
import type { PlaceCategory } from "@/types";

/**
 * GET /api/places
 * Returns places from database
 *
 * Query params (all optional):
 * - category: Filter by category (e.g., "food", "accommodation")
 * - maxPrice: Maximum price filter
 * - limit: Limit number of results
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get("category") as PlaceCategory | null;
  const maxPrice = searchParams.get("maxPrice");
  const limit = searchParams.get("limit");

  // Build query conditions
  const conditions = [];

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

    conditions.push(eq(places.category, category));
  }

  if (maxPrice) {
    const maxPriceNum = parseInt(maxPrice, 10);
    if (isNaN(maxPriceNum) || maxPriceNum < 0) {
      return NextResponse.json(
        { error: "maxPrice must be a positive number" },
        { status: 400 }
      );
    }
    conditions.push(lte(places.price, maxPriceNum));
  }

  // Query database
  let query = db.select().from(places);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      return NextResponse.json(
        { error: "limit must be a positive number" },
        { status: 400 }
      );
    }
    query = query.limit(limitNum) as typeof query;
  }

  const results = await query;

  // Transform to match Place interface
  const placesData = results.map((row) => ({
    id: `place-${row.id}`,
    name: row.name,
    description: row.description || "",
    category: row.category as PlaceCategory,
    coordinates: { lat: row.lat, lng: row.lng },
    price: row.price ?? undefined,
    rating: row.rating ?? undefined,
    address: row.address ?? undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
  }));

  return NextResponse.json({
    count: placesData.length,
    places: placesData,
  });
}

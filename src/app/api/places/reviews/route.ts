import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

/**
 * Normalize place name to create a consistent key
 */
function normalizeKey(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * GET /api/places/reviews?name=PlaceName
 * Get reviews for a place by name
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }

  const placeKey = normalizeKey(name);

  const reviews = await db.query.placeReviews.findMany({
    where: eq(schema.placeReviews.placeKey, placeKey),
    orderBy: desc(schema.placeReviews.createdAt),
  });

  // Get user info for each review
  const reviewsWithUsers = await Promise.all(
    reviews.map(async (review) => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, review.userId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });
      return { ...review, user };
    })
  );

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return NextResponse.json({
    placeKey,
    placeName: reviews[0]?.placeName || name,
    rating: avgRating,
    reviewCount: reviews.length,
    reviews: reviewsWithUsers,
  });
}

/**
 * POST /api/places/reviews
 * Add a review for a place
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { placeName, placeCategory, rating, comment } = body;

    // Validate
    if (!placeName) {
      return NextResponse.json({ error: "Missing placeName" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const placeKey = normalizeKey(placeName);

    // Check if user already reviewed this place
    const existingReview = await db.query.placeReviews.findFirst({
      where: (reviews, { and, eq }) =>
        and(
          eq(reviews.placeKey, placeKey),
          eq(reviews.userId, session.userId)
        ),
    });

    if (existingReview) {
      // Update existing review
      const [updated] = await db
        .update(schema.placeReviews)
        .set({
          rating,
          comment: comment || null,
        })
        .where(eq(schema.placeReviews.id, existingReview.id))
        .returning();

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, session.userId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      return NextResponse.json({
        review: { ...updated, user },
        updated: true,
      });
    }

    // Create new review
    const [review] = await db
      .insert(schema.placeReviews)
      .values({
        placeKey,
        placeName,
        placeCategory: placeCategory || null,
        userId: session.userId,
        rating,
        comment: comment || null,
      })
      .returning();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.userId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      review: { ...review, user },
      updated: false,
    });
  } catch (error) {
    console.error("Create place review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}


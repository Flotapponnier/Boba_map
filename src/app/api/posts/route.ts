import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/posts - Get all posts
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");

  let posts;

  if (category) {
    posts = await db.query.posts.findMany({
      where: eq(schema.posts.category, category),
      orderBy: desc(schema.posts.createdAt),
      with: {
        // We'll add relations later if needed
      },
    });
  } else {
    posts = await db.query.posts.findMany({
      orderBy: desc(schema.posts.createdAt),
    });
  }

  // Get user info for each post
  const postsWithUsers = await Promise.all(
    posts.map(async (post) => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, post.userId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      // Get average rating
      const feedbacks = await db.query.feedbacks.findMany({
        where: eq(schema.feedbacks.postId, post.id),
      });

      const avgRating =
        feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
          : null;

      return {
        ...post,
        user,
        rating: avgRating,
        feedbackCount: feedbacks.length,
      };
    })
  );

  return NextResponse.json({ posts: postsWithUsers });
}

/**
 * POST /api/posts - Create a new post
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, category, lat, lng, address, price, imageUrl } =
      body;

    // Validate
    if (!title || !description || !category || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, category, lat, lng" },
        { status: 400 }
      );
    }

    const validCategories = [
      "accommodation",
      "food",
      "event",
      "activity",
      "service",
      "nightlife",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Create post
    const [post] = await db
      .insert(schema.posts)
      .values({
        userId: session.userId,
        title,
        description,
        category,
        lat,
        lng,
        address: address || null,
        price: price || null,
        imageUrl: imageUrl || null,
      })
      .returning();

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, session.userId),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      post: {
        ...post,
        user,
        rating: null,
        feedbackCount: 0,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}


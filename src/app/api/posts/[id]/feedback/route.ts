import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/posts/[id]/feedback - Add feedback to a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  // Check if post exists
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user already gave feedback
    const existingFeedback = await db.query.feedbacks.findFirst({
      where: and(
        eq(schema.feedbacks.postId, postId),
        eq(schema.feedbacks.userId, session.userId)
      ),
    });

    if (existingFeedback) {
      // Update existing feedback
      const [updated] = await db
        .update(schema.feedbacks)
        .set({ rating, comment: comment || null })
        .where(eq(schema.feedbacks.id, existingFeedback.id))
        .returning();

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, session.userId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      return NextResponse.json({ feedback: { ...updated, user } });
    }

    // Create new feedback
    const [feedback] = await db
      .insert(schema.feedbacks)
      .values({
        postId,
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

    return NextResponse.json({ feedback: { ...feedback, user } });
  } catch (error) {
    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}


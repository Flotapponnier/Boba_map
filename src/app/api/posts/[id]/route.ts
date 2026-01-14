import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/posts/[id] - Get a single post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, postId),
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Get user info
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, post.userId),
    columns: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  });

  // Get feedbacks
  const feedbacks = await db.query.feedbacks.findMany({
    where: eq(schema.feedbacks.postId, postId),
  });

  // Get feedback users
  const feedbacksWithUsers = await Promise.all(
    feedbacks.map(async (feedback) => {
      const feedbackUser = await db.query.users.findFirst({
        where: eq(schema.users.id, feedback.userId),
        columns: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });
      return { ...feedback, user: feedbackUser };
    })
  );

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : null;

  return NextResponse.json({
    post: {
      ...post,
      user,
      rating: avgRating,
      feedbackCount: feedbacks.length,
      feedbacks: feedbacksWithUsers,
    },
  });
}

/**
 * DELETE /api/posts/[id] - Delete a post
 */
export async function DELETE(
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

  // Check if post exists and belongs to user
  const post = await db.query.posts.findFirst({
    where: and(
      eq(schema.posts.id, postId),
      eq(schema.posts.userId, session.userId)
    ),
  });

  if (!post) {
    return NextResponse.json(
      { error: "Post not found or not authorized" },
      { status: 404 }
    );
  }

  // Delete feedbacks first
  await db.delete(schema.feedbacks).where(eq(schema.feedbacks.postId, postId));

  // Delete post
  await db.delete(schema.posts).where(eq(schema.posts.id, postId));

  return NextResponse.json({ success: true });
}




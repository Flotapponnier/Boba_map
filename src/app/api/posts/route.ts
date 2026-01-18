import { NextRequest, NextResponse } from "next/server";
import { db, schema, getCurrentUser } from "@/server";
import { eq, desc, and, or, isNull, inArray } from "drizzle-orm";

/**
 * GET /api/posts - Get all posts
 * Posts visibility:
 * - Posts without community: visible to everyone
 * - Posts in public communities: visible to everyone  
 * - Posts in private communities: visible only to members
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const communityId = searchParams.get("communityId");

    // Get current user to check community memberships
    const session = await getCurrentUser();
    
    // Get user's community memberships
    let userCommunityIds: number[] = [];
    if (session) {
      const memberships = await db.query.communityMembers.findMany({
        where: eq(schema.communityMembers.userId, session.userId),
        columns: { communityId: true },
      });
      userCommunityIds = memberships.map((m) => m.communityId);
    }

    // Get all public communities
    const publicCommunities = await db.query.communities.findMany({
      where: eq(schema.communities.isPublic, true),
      columns: { id: true },
    });
    const publicCommunityIds = publicCommunities.map((c) => c.id);

    // Build visibility filter
    // A post is visible if:
    // 1. It has no community (communityId is null), OR
    // 2. It belongs to a public community, OR  
    // 3. User is a member of the private community
    const visibleCommunityIds = [...new Set([...publicCommunityIds, ...userCommunityIds])];
    
    let whereClause;
    if (communityId) {
      // Filtering by specific community
      const commId = parseInt(communityId);
      const isVisible = visibleCommunityIds.includes(commId);
      if (!isVisible) {
        return NextResponse.json({ posts: [] });
      }
      whereClause = category
        ? and(eq(schema.posts.communityId, commId), eq(schema.posts.category, category))
        : eq(schema.posts.communityId, commId);
    } else {
      // Get all visible posts (no community OR in visible communities)
      // Note: We need to get posts without community + posts in visible communities
      whereClause = category
        ? eq(schema.posts.category, category)
        : undefined;
    }

    const allPosts = await db.query.posts.findMany({
      where: whereClause,
      orderBy: desc(schema.posts.createdAt),
    });

    // Filter posts by visibility
    const posts = allPosts.filter((post) => {
      // No community = visible to all
      if (!post.communityId) return true;
      // Has community = check if visible
      return visibleCommunityIds.includes(post.communityId);
    });

    // Get user info and community info for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, post.userId),
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        });

        // Get community info if applicable
        let community = null;
        if (post.communityId) {
          community = await db.query.communities.findFirst({
            where: eq(schema.communities.id, post.communityId),
            columns: {
              id: true,
              name: true,
              isPublic: true,
            },
          });
        }

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
          community,
          rating: avgRating,
          feedbackCount: feedbacks.length,
        };
      })
    );

    return NextResponse.json({ posts: postsWithDetails });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts", posts: [] }, { status: 500 });
  }
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
    const { title, description, category, lat, lng, address, price, imageUrl, communityId } =
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

    // If communityId is provided, verify user is a member
    if (communityId) {
      const membership = await db.query.communityMembers.findFirst({
        where: and(
          eq(schema.communityMembers.communityId, communityId),
          eq(schema.communityMembers.userId, session.userId)
        ),
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member of the community to post there" },
          { status: 403 }
        );
      }
    }

    // Create post
    const [post] = await db
      .insert(schema.posts)
      .values({
        userId: session.userId,
        communityId: communityId || null,
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

    // Get community info if applicable
    let community = null;
    if (post.communityId) {
      community = await db.query.communities.findFirst({
        where: eq(schema.communities.id, post.communityId),
        columns: {
          id: true,
          name: true,
          isPublic: true,
        },
      });
    }

    return NextResponse.json({
      post: {
        ...post,
        user,
        community,
        rating: null,
        feedbackCount: 0,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}




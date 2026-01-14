import { NextRequest, NextResponse } from "next/server";
import { db, schema, getCurrentUser } from "@/server";
import type { Community } from "@/server/db/schema";
import { eq, like, or, desc } from "drizzle-orm";

/**
 * GET /api/communities - Get all communities or search
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const myOnly = searchParams.get("my") === "true";

  try {
    const currentUser = await getCurrentUser();

    let communities: Community[] = [];

    if (search) {
      // Search communities by name or description
      communities = await db.query.communities.findMany({
        where: or(
          like(schema.communities.name, `%${search}%`),
          like(schema.communities.description, `%${search}%`)
        ),
        orderBy: desc(schema.communities.createdAt),
      });
    } else if (myOnly && currentUser) {
      // Get communities the user is a member of
      const memberships = await db.query.communityMembers.findMany({
        where: eq(schema.communityMembers.userId, currentUser.userId),
      });
      const communityIds = memberships.map((m) => m.communityId);
      
      if (communityIds.length > 0) {
        communities = await db.query.communities.findMany({
          orderBy: desc(schema.communities.createdAt),
        });
        communities = communities.filter((c) => communityIds.includes(c.id));
      } else {
        communities = [];
      }
    } else {
      // Get all public communities
      communities = await db.query.communities.findMany({
        where: eq(schema.communities.isPublic, true),
        orderBy: desc(schema.communities.createdAt),
      });
    }

    // Add member count and creator info for each community
    const communitiesWithDetails = await Promise.all(
      communities.map(async (community) => {
        const members = await db.query.communityMembers.findMany({
          where: eq(schema.communityMembers.communityId, community.id),
        });

        const creator = await db.query.users.findFirst({
          where: eq(schema.users.id, community.creatorId),
          columns: { id: true, username: true, avatarUrl: true },
        });

        // Check if current user is a member
        let isMember = false;
        let userRole = null;
        let hasPendingRequest = false;

        if (currentUser) {
          const membership = members.find((m) => m.userId === currentUser.userId);
          isMember = !!membership;
          userRole = membership?.role || null;

          // Check for pending request
          if (!isMember) {
            const pendingRequest = await db.query.joinRequests.findFirst({
              where: eq(schema.joinRequests.communityId, community.id),
            });
            if (pendingRequest && pendingRequest.userId === currentUser.userId && pendingRequest.status === "pending") {
              hasPendingRequest = true;
            }
          }
        }

        return {
          ...community,
          memberCount: members.length,
          creator,
          isMember,
          userRole,
          hasPendingRequest,
        };
      })
    );

    return NextResponse.json({ communities: communitiesWithDetails });
  } catch (error) {
    console.error("Get communities error:", error);
    return NextResponse.json({ error: "Failed to get communities" }, { status: 500 });
  }
}

/**
 * POST /api/communities - Create a new community
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { name, description, imageUrl, isPublic } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Community name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Create community
    const [community] = await db
      .insert(schema.communities)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic !== false, // Default to public
        creatorId: session.userId,
      })
      .returning();

    // Add creator as admin member
    await db.insert(schema.communityMembers).values({
      communityId: community.id,
      userId: session.userId,
      role: "admin",
    });

    // Get creator info
    const creator = await db.query.users.findFirst({
      where: eq(schema.users.id, session.userId),
      columns: { id: true, username: true, avatarUrl: true },
    });

    return NextResponse.json({
      community: {
        ...community,
        memberCount: 1,
        creator,
        isMember: true,
        userRole: "admin",
      },
    });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}


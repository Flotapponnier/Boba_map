import { NextRequest, NextResponse } from "next/server";
import { db, schema, getCurrentUser } from "@/server";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/communities/[id]/join - Join a community or request to join
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const communityId = parseInt(id, 10);

  if (isNaN(communityId)) {
    return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
  }

  try {
    // Get community
    const community = await db.query.communities.findFirst({
      where: eq(schema.communities.id, communityId),
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await db.query.communityMembers.findFirst({
      where: and(
        eq(schema.communityMembers.communityId, communityId),
        eq(schema.communityMembers.userId, session.userId)
      ),
    });

    if (existingMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // If public community, join directly
    if (community.isPublic) {
      await db.insert(schema.communityMembers).values({
        communityId,
        userId: session.userId,
        role: "member",
      });

      return NextResponse.json({
        success: true,
        message: "Successfully joined the community!",
        status: "joined",
      });
    }

    // If private, check for existing request
    const existingRequest = await db.query.joinRequests.findFirst({
      where: and(
        eq(schema.joinRequests.communityId, communityId),
        eq(schema.joinRequests.userId, session.userId),
        eq(schema.joinRequests.status, "pending")
      ),
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Request already pending" }, { status: 400 });
    }

    // Get optional message from body
    const body = await request.json().catch(() => ({}));
    const message = body.message || null;

    // Create join request
    await db.insert(schema.joinRequests).values({
      communityId,
      userId: session.userId,
      message,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Join request sent! Waiting for admin approval.",
      status: "pending",
    });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json({ error: "Failed to join community" }, { status: 500 });
  }
}

/**
 * DELETE /api/communities/[id]/join - Leave a community
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const communityId = parseInt(id, 10);

  if (isNaN(communityId)) {
    return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
  }

  try {
    // Check if user is the creator
    const community = await db.query.communities.findFirst({
      where: eq(schema.communities.id, communityId),
    });

    if (community && community.creatorId === session.userId) {
      return NextResponse.json(
        { error: "Creator cannot leave the community. Delete it instead." },
        { status: 400 }
      );
    }

    // Remove membership
    await db
      .delete(schema.communityMembers)
      .where(
        and(
          eq(schema.communityMembers.communityId, communityId),
          eq(schema.communityMembers.userId, session.userId)
        )
      );

    return NextResponse.json({ success: true, message: "Left the community" });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json({ error: "Failed to leave community" }, { status: 500 });
  }
}


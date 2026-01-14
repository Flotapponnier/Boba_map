import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/communities/[id]/requests - Get pending join requests (admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    // Check if user is admin
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(schema.communityMembers.communityId, communityId),
        eq(schema.communityMembers.userId, session.userId)
      ),
    });

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get pending requests
    const requests = await db.query.joinRequests.findMany({
      where: and(
        eq(schema.joinRequests.communityId, communityId),
        eq(schema.joinRequests.status, "pending")
      ),
    });

    // Add user info
    const requestsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, req.userId),
          columns: { id: true, username: true, avatarUrl: true },
        });
        return { ...req, user };
      })
    );

    return NextResponse.json({ requests: requestsWithUsers });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json({ error: "Failed to get requests" }, { status: 500 });
  }
}

/**
 * POST /api/communities/[id]/requests - Accept or reject a join request
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
    const { requestId, action } = await request.json();

    if (!requestId || !["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Provide requestId and action (accept/reject)" },
        { status: 400 }
      );
    }

    // Check if user is admin
    const membership = await db.query.communityMembers.findFirst({
      where: and(
        eq(schema.communityMembers.communityId, communityId),
        eq(schema.communityMembers.userId, session.userId)
      ),
    });

    if (!membership || membership.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get the request
    const joinRequest = await db.query.joinRequests.findFirst({
      where: and(
        eq(schema.joinRequests.id, requestId),
        eq(schema.joinRequests.communityId, communityId)
      ),
    });

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    // Update request status
    const newStatus = action === "accept" ? "accepted" : "rejected";
    await db
      .update(schema.joinRequests)
      .set({
        status: newStatus,
        respondedAt: new Date(),
        respondedBy: session.userId,
      })
      .where(eq(schema.joinRequests.id, requestId));

    // If accepted, add as member
    if (action === "accept") {
      await db.insert(schema.communityMembers).values({
        communityId,
        userId: joinRequest.userId,
        role: "member",
      });
    }

    return NextResponse.json({
      success: true,
      message: action === "accept" ? "Request accepted!" : "Request rejected",
    });
  } catch (error) {
    console.error("Process request error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}


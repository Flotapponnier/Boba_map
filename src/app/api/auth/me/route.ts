import { NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.userId);
  
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}




import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { 
        id: true,
        role: true 
      },
    });

    return NextResponse.json({ 
      role: profile?.role ?? null,
      profileId: profile?.id ?? null
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
  }
}

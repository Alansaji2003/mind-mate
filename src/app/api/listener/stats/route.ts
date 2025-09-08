// app/api/listener/stats/route.ts
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// GET /api/listener/stats?userId=...
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        reputation: true,
        topics: true,
        availability: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ role: null })
    }

    if (profile.role !== "LISTENER") {
      return NextResponse.json({ role: profile.role })
    }

    // Format availability to strings (HH:mm)
    const availability = profile.availability.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.toISOString().slice(11, 16), // HH:mm
      endTime: slot.endTime.toISOString().slice(11, 16), // HH:mm
    }))

    const stats = {
      avgRating: profile.reputation?.avgRating ?? 0,
      totalRatings: profile.reputation?.totalRatings ?? 0,
      trustMeter: profile.reputation?.trustMeter ?? 0,
      badgesEarned: profile.reputation?.badges.length ?? 0,
      topics: profile.topics.map((t) => t.topic),
      availability,
    }

    return NextResponse.json({ role: "LISTENER", stats })
  } catch (err) {
    console.error("Failed to fetch listener stats", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

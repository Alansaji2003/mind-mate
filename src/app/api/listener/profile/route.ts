import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET - Fetch listener profile data
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        topics: true,
        availability: true,
        reputation: true
      }
    })

    if (!profile || profile.role !== "LISTENER") {
      return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
    }

    // Format the data for frontend
    const formattedProfile = {
      id: profile.id,
      topics: profile.topics.map(t => ({ id: t.id, name: t.topic })),
      availability: profile.availability.map(a => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime.toISOString().slice(11, 16), // HH:mm format
        endTime: a.endTime.toISOString().slice(11, 16)
      })),
      reputation: profile.reputation ? {
        avgRating: profile.reputation.avgRating,
        totalRatings: profile.reputation.totalRatings,
        trustMeter: profile.reputation.trustMeter,
        badges: profile.reputation.badges
      } : null
    }

    return NextResponse.json(formattedProfile)
  } catch (err) {
    console.error("Error fetching listener profile:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT - Update entire listener profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { topics, availability } = body

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile || profile.role !== "LISTENER") {
      return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete existing topics and availability
      await tx.listenerTopic.deleteMany({
        where: { listenerId: profile.id }
      })
      await tx.listenerAvailability.deleteMany({
        where: { listenerId: profile.id }
      })

      // Create new topics
      if (topics && topics.length > 0) {
        await tx.listenerTopic.createMany({
          data: topics
            .filter((t: any) => t.name && t.name.trim())
            .map((t: any) => ({
              listenerId: profile.id,
              topic: t.name.trim()
            }))
        })
      }

      // Create new availability
      if (availability && availability.length > 0) {
        await tx.listenerAvailability.createMany({
          data: availability.map((a: any) => ({
            listenerId: profile.id,
            dayOfWeek: a.dayOfWeek,
            startTime: new Date(`1970-01-01T${a.startTime}:00Z`),
            endTime: new Date(`1970-01-01T${a.endTime}:00Z`)
          }))
        })
      }
    })

    return NextResponse.json({ success: true, message: "Profile updated successfully" })
  } catch (err) {
    console.error("Error updating listener profile:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, topics, availability } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // 🔹 Find the listener's UserProfile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    if (!profile) {
      return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
    }

    const listenerId = profile.id

    // 🔹 Save topics
    for (const t of topics) {
      if (!t.name) continue
      await prisma.listenerTopic.create({
        data: { listenerId, topic: t.name }
      })
    }

    // 🔹 Save availability
    for (const a of availability) {
      await prisma.listenerAvailability.create({
        data: {
          listenerId,
          dayOfWeek: a.dayOfWeek,
          startTime: new Date(`1970-01-01T${a.startTime}:00Z`),
          endTime: new Date(`1970-01-01T${a.endTime}:00Z`)
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[saveListener] Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// POST - Add a new topic
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { topic } = body

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic name is required" }, { status: 400 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile || profile.role !== "LISTENER") {
      return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
    }

    const newTopic = await prisma.listenerTopic.create({
      data: {
        listenerId: profile.id,
        topic: topic.trim()
      }
    })

    return NextResponse.json({ 
      success: true, 
      topic: { id: newTopic.id, name: newTopic.topic }
    })
  } catch (err) {
    console.error("Error adding topic:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE - Remove a topic
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get("id")

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile || profile.role !== "LISTENER") {
      return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
    }

    // Verify the topic belongs to this listener
    const topic = await prisma.listenerTopic.findFirst({
      where: {
        id: topicId,
        listenerId: profile.id
      }
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    await prisma.listenerTopic.delete({
      where: { id: topicId }
    })

    return NextResponse.json({ success: true, message: "Topic deleted successfully" })
  } catch (err) {
    console.error("Error deleting topic:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
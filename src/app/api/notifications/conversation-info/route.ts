import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    const userId = searchParams.get("userId")

    if (!conversationId || !userId) {
      return NextResponse.json({ error: "Missing conversationId or userId" }, { status: 400 })
    }

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        speaker: {
          include: { user: true }
        },
        listener: {
          include: { user: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get the user's profile to check if they are the listener
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId }
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Check if the user is the intended listener for this conversation
    if (userProfile.id !== conversation.listenerId) {
      return NextResponse.json({ error: "Not authorized for this conversation" }, { status: 403 })
    }

    return NextResponse.json({
      id: conversation.id,
      speakerId: conversation.speakerId,
      listenerId: conversation.listenerId,
      speakerName: "Anonymous Speaker", // Always anonymous for privacy
      listenerName: conversation.listener.user.name,
      topic: conversation.topic,
      startedAt: conversation.startedAt,
      isActive: conversation.isActive
    })

  } catch (err) {
    console.error("Error fetching conversation info for notification:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
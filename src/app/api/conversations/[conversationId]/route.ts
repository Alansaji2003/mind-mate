import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
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

    // Check if user is part of this conversation
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!userProfile || (userProfile.id !== conversation.speakerId && userProfile.id !== conversation.listenerId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      id: conversation.id,
      speakerId: conversation.speakerId,
      listenerId: conversation.listenerId,
      speakerName: conversation.speaker.user.name,
      listenerName: conversation.listener.user.name,
      topic: conversation.topic,
      startedAt: conversation.startedAt,
      isActive: conversation.isActive
    })

  } catch (err) {
    console.error("Error fetching conversation:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Check if user is the speaker (only speakers can end sessions)
    if (conversation.speakerId !== userProfile.id) {
      return NextResponse.json({ error: "Only the speaker can end the session" }, { status: 403 })
    }

    // End the conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    })

    // Send a session end message to notify the listener
    try {
      const { Client, Databases, ID } = await import("appwrite")
      const { env } = await import("@/lib/env")
      
      const appwriteClient = new Client()
        .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      
      const databases = new Databases(appwriteClient)
      
      await databases.createDocument(
        env.NEXT_PUBLIC_APPWRITE_DB_ID,
        env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
        ID.unique(),
        {
          sessionId: conversationId,
          senderId: "SYSTEM",
          content: "SESSION_ENDED",
        }
      )
    } catch (appwriteError) {
      console.error("Failed to send session end notification:", appwriteError)
      // Don't fail the conversation ending if Appwrite fails
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("Error ending conversation:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

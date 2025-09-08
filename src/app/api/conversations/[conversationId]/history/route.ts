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
    
    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get conversation and verify user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        speaker: {
          include: { user: true }
        },
        listener: {
          include: { user: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Limit to last 10 messages for history preview
          include: {
            sender: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Check if user is part of this conversation
    if (conversation.speakerId !== userProfile.id && conversation.listenerId !== userProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Format the response
    const formattedConversation = {
      id: conversation.id,
      topic: conversation.topic,
      startedAt: conversation.startedAt,
      isActive: conversation.isActive,
      messageCount: conversation.messages.length,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        senderName: msg.sender.name,
        isFromCurrentUser: msg.senderId === session.user.id
      }))
    }

    return NextResponse.json({ conversation: formattedConversation })

  } catch (err) {
    console.error("Error fetching conversation history:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
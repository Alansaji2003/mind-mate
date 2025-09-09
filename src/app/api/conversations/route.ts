import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { resend } from "@/lib/resend"
import { auth } from "@/lib/auth"
import { Client, Databases, ID } from "appwrite"
import { env } from "@/lib/env"

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

const databases = new Databases(client)
const baseUrl = env.NEXT_PUBLIC_APP_URL

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get active conversations where user is either speaker or listener
    const conversations = await prisma.conversation.findMany({
      where: {
        isActive: true,
        OR: [
          { speakerId: userProfile.id },
          { listenerId: userProfile.id }
        ]
      },
      include: {
        speaker: {
          include: { user: true }
        },
        listener: {
          include: { user: true }
        },
        messages: {
          select: { id: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    })

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      speakerName: conv.speaker.user.name,
      listenerName: conv.listener.user.name,
      topic: conv.topic,
      startedAt: conv.startedAt.toISOString(),
      isActive: conv.isActive,
      messageCount: conv.messages.length
    }))

    return NextResponse.json({ conversations: formattedConversations })

  } catch (err) {
    console.error("Error fetching conversations:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: req.headers
    })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { listenerId, topic } = body

    if (!listenerId) {
      return NextResponse.json(
        { error: "Missing listenerId" },
        { status: 400 }
      )
    }

    // Get speaker profile
    const speakerProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!speakerProfile || speakerProfile.role !== "SPEAKER") {
      return NextResponse.json(
        { error: "Speaker profile not found" },
        { status: 404 }
      )
    }

    // Get listener profile
    const listenerProfile = await prisma.userProfile.findUnique({
      where: { id: listenerId },
      include: { user: true }
    })

    if (!listenerProfile || listenerProfile.role !== "LISTENER") {
      return NextResponse.json(
        { error: "Listener not found" },
        { status: 404 }
      )
    }

    // Check for existing active conversation between this speaker and listener
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        speakerId: speakerProfile.id,
        listenerId: listenerProfile.id,
        isActive: true
      },
      include: {
        speaker: {
          include: { user: true }
        },
        listener: {
          include: { user: true }
        }
      }
    })

    let conversation
    let isNewConversation = false

    if (existingConversation) {
      // Return existing active conversation
      conversation = existingConversation
      isNewConversation = false
    } else {
      // Create a new conversation
      conversation = await prisma.conversation.create({
        data: {
          speakerId: speakerProfile.id,
          listenerId: listenerProfile.id,
          topic: topic || null,
          isActive: true,
        },
        include: {
          speaker: {
            include: { user: true }
          },
          listener: {
            include: { user: true }
          }
        }
      })
      isNewConversation = true
    }

    // Only create connection message for new conversations
    if (isNewConversation) {
      try {
        const messageContent = topic 
          ? `Connected to discuss: ${topic}`
          : "Connected for conversation"
        
        await databases.createDocument(
          env.NEXT_PUBLIC_APPWRITE_DB_ID,
          env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
          ID.unique(),
          {
            sessionId: conversation.id,
            senderId: session.user.id,
            content: messageContent,
          }
        )
        
      } catch (appwriteError) {
        console.error("Failed to create message in Appwrite:", appwriteError)
        // Don't fail the conversation creation if Appwrite fails
      }
    }

    // Send email notification to listener only for new conversations
    if (isNewConversation) {
      try {
        const emailSubject = 'New Chat Session Started'
        const emailTitle = 'New Chat Session Started'
        const emailMessage = `A new chat session has been started with you by <strong>${speakerProfile.user.name}</strong>.`
        
        console.log(`Sending email to: ${listenerProfile.user.email}`)
        const emailResult = await resend.emails.send({
          from: 'MINDMATE <onboarding@resend.dev>',
          to: listenerProfile.user.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${emailTitle}</h2>
              <p>Hello ${listenerProfile.user.name},</p>
              <p>${emailMessage}</p>
              ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}
              <p>Click the button below to join the conversation:</p>
              <a href="${baseUrl}/dashboard/chat/${conversation.id}" 
                 style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Join Conversation
              </a>
              <p style="color: #666; font-size: 14px; margin-top: 24px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          `,
        })
        console.log('Email sent successfully:', emailResult)
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
        console.error("Email error details:", emailError)
        // Don't fail the conversation creation if email fails
      }
    }

    return NextResponse.json({
      conversation,
      sessionId: conversation.id, // Use conversation ID as sessionId for Appwrite
      isNewConversation,
      message: isNewConversation ? "New conversation created" : "Rejoined existing conversation"
    })

  } catch (err) {
    console.error("Error creating conversation:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

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
    const { conversationId, rating, comment } = body

    if (!conversationId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Missing or invalid conversationId or rating" },
        { status: 400 }
      )
    }

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get conversation to verify user is the speaker
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listener: {
          include: { user: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Only speakers can give feedback
    if (conversation.speakerId !== userProfile.id) {
      return NextResponse.json({ error: "Only speakers can give feedback" }, { status: 403 })
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        conversationId: conversationId,
        givenById: session.user.id
      }
    })

    if (existingFeedback) {
      return NextResponse.json({ error: "Feedback already submitted for this conversation" }, { status: 400 })
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        conversationId: conversationId,
        givenById: session.user.id,
        rating: rating,
        comment: comment || null
      }
    })

    // Update listener reputation
    const listenerId = conversation.listenerId
    
    // Get current reputation or create if doesn't exist
    let reputation = await prisma.listenerReputation.findUnique({
      where: { listenerId: listenerId }
    })

    if (!reputation) {
      reputation = await prisma.listenerReputation.create({
        data: {
          listenerId: listenerId,
          avgRating: rating,
          totalRatings: 1,
          trustMeter: 100,
          badges: []
        }
      })
    } else {
      // Calculate new average rating
      const newTotalRatings = reputation.totalRatings + 1
      const newAvgRating = ((reputation.avgRating * reputation.totalRatings) + rating) / newTotalRatings
      
      // Update reputation
      reputation = await prisma.listenerReputation.update({
        where: { listenerId: listenerId },
        data: {
          avgRating: newAvgRating,
          totalRatings: newTotalRatings,
          // Adjust trust meter based on rating (simple logic)
          trustMeter: Math.min(100, reputation.trustMeter + (rating >= 4 ? 1 : -1))
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      feedback,
      message: "Thank you for your feedback!"
    })

  } catch (err) {
    console.error("Error submitting feedback:", err)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
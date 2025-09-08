import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role to determine what analytics to show
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    // Get date range from query params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (userProfile?.role === "LISTENER") {
      // Analytics for listeners - their own performance
      const conversations = await prisma.conversation.findMany({
        where: {
          listenerId: userProfile.id,
          startedAt: { gte: startDate }
        },
        include: {
          messages: true,
          feedback: true
        },
        orderBy: { startedAt: 'asc' }
      })

      // Group by date for chart
      const dailyStats = new Map<string, {
        date: string
        conversations: number
        messages: number
        avgRating: number
        totalRatings: number
      }>()

      conversations.forEach(conv => {
        const dateKey = conv.startedAt.toISOString().split('T')[0]
        const existing = dailyStats.get(dateKey) || {
          date: dateKey,
          conversations: 0,
          messages: 0,
          avgRating: 0,
          totalRatings: 0
        }

        existing.conversations += 1
        existing.messages += conv.messages.length

        if (conv.feedback.length > 0) {
          const rating = conv.feedback[0].rating
          existing.avgRating = ((existing.avgRating * existing.totalRatings) + rating) / (existing.totalRatings + 1)
          existing.totalRatings += 1
        }

        dailyStats.set(dateKey, existing)
      })

      const chartData = Array.from(dailyStats.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Overall stats
      const totalConversations = conversations.length
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
      const allFeedback = conversations.flatMap(conv => conv.feedback)
      const avgRating = allFeedback.length > 0 
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length 
        : 0

      return NextResponse.json({
        chartData,
        summary: {
          totalConversations,
          totalMessages,
          avgRating: Math.round(avgRating * 10) / 10,
          totalFeedback: allFeedback.length
        }
      })

    } else {
      // Analytics for speakers - platform overview
      const [
        totalListeners,
        totalConversations,
        recentConversations,
        topRatedListeners
      ] = await Promise.all([
        prisma.userProfile.count({ where: { role: "LISTENER" } }),
        prisma.conversation.count({ where: { startedAt: { gte: startDate } } }),
        prisma.conversation.findMany({
          where: { startedAt: { gte: startDate } },
          include: { messages: true },
          orderBy: { startedAt: 'asc' }
        }),
        prisma.listenerReputation.findMany({
          where: { totalRatings: { gt: 0 } },
          include: { listener: { include: { user: true } } },
          orderBy: { avgRating: 'desc' },
          take: 5
        })
      ])

      // Group conversations by date
      const dailyStats = new Map<string, {
        date: string
        conversations: number
        messages: number
        activeListeners: Set<string>
      }>()

      recentConversations.forEach(conv => {
        const dateKey = conv.startedAt.toISOString().split('T')[0]
        const existing = dailyStats.get(dateKey) || {
          date: dateKey,
          conversations: 0,
          messages: 0,
          activeListeners: new Set<string>()
        }

        existing.conversations += 1
        existing.messages += conv.messages.length
        existing.activeListeners.add(conv.listenerId)

        dailyStats.set(dateKey, existing)
      })

      const chartData = Array.from(dailyStats.values()).map(stat => ({
        date: stat.date,
        conversations: stat.conversations,
        messages: stat.messages,
        activeListeners: stat.activeListeners.size
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return NextResponse.json({
        chartData,
        summary: {
          totalListeners,
          totalConversations,
          totalMessages: recentConversations.reduce((sum, conv) => sum + conv.messages.length, 0),
          topRatedListeners: topRatedListeners.map(rep => ({
            name: rep.listener.user.name,
            rating: Math.round(rep.avgRating * 10) / 10,
            totalRatings: rep.totalRatings
          }))
        }
      })
    }

  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
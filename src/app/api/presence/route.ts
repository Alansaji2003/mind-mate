import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// In-memory store for user presence (in production, use Redis)
const userPresence = new Map<string, { lastSeen: number, isOnline: boolean }>()

// Consider user offline after 3 minutes of inactivity (increased threshold)
const OFFLINE_THRESHOLD = 3 * 60 * 1000 // 3 minutes in milliseconds

// Cache for GET requests to reduce computation
let lastCleanup = 0
const CLEANUP_INTERVAL = 30000 // Clean up every 30 seconds

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const now = Date.now()

    // Update user's last seen timestamp
    userPresence.set(userId, {
      lastSeen: now,
      isOnline: true
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating presence:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userIds = searchParams.get("userIds")?.split(",") || []
    
    if (userIds.length === 0) {
      return NextResponse.json({ onlineStatus: {} })
    }

    const now = Date.now()
    const onlineStatus: Record<string, boolean> = {}

    // Only clean up periodically to improve performance
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      // Clean up old entries
      for (const [userId, presence] of userPresence.entries()) {
        const isOnline = (now - presence.lastSeen) < OFFLINE_THRESHOLD
        if (!isOnline) {
          userPresence.delete(userId)
        }
      }
      lastCleanup = now
    }

    // Check online status for requested users only
    for (const userId of userIds) {
      const presence = userPresence.get(userId)
      if (presence) {
        const isOnline = (now - presence.lastSeen) < OFFLINE_THRESHOLD
        onlineStatus[userId] = isOnline
      } else {
        onlineStatus[userId] = false
      }
    }

    // Add cache headers to reduce unnecessary requests
    return new NextResponse(JSON.stringify({ onlineStatus }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10', // Cache for 10 seconds
      }
    })
  } catch (error) {
    console.error("Error fetching presence:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
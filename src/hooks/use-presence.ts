"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { authClient } from "@/lib/auth-client"

// Global cache for online status to avoid duplicate requests
const onlineStatusCache = new Map<string, { data: Record<string, boolean>, timestamp: number }>()
const CACHE_DURATION = 15000 // 15 seconds cache

export function usePresence() {
  const { data: session } = authClient.useSession()
  const lastHeartbeatRef = useRef<number>(0)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Debounced heartbeat function
    const sendHeartbeat = async () => {
      const now = Date.now()
      // Prevent sending heartbeat more than once every 10 seconds
      if (now - lastHeartbeatRef.current < 10000) return

      try {
        lastHeartbeatRef.current = now
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })
      } catch (error) {
        console.error("Failed to send heartbeat:", error)
      }
    }

    // Debounced activity handler
    const handleActivity = () => {
      // Clear existing timeout
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = null
      }

      // Set new timeout to send heartbeat after 2 seconds of inactivity
      heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, 2000)
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval for regular heartbeats (reduced frequency)
    const interval = setInterval(sendHeartbeat, 60000) // 60 seconds instead of 30

    // Listen for user activity (reduced events)
    const events = ['mousedown', 'keypress', 'click'] // Removed mousemove and scroll for performance
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Send heartbeat when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = null
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.id])
}

export function useOnlineStatus(userIds: string[]) {
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchOnlineStatus = useCallback(async () => {
    if (userIds.length === 0) {
      setLoading(false)
      return
    }

    // Create cache key
    const cacheKey = userIds.sort().join(',')
    const cached = onlineStatusCache.get(cacheKey)
    const now = Date.now()

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setOnlineStatus(cached.data)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/presence?userIds=${userIds.join(",")}`)
      if (response.ok) {
        const data = await response.json()
        setOnlineStatus(data.onlineStatus)

        // Cache the result
        onlineStatusCache.set(cacheKey, {
          data: data.onlineStatus,
          timestamp: now
        })
      }
    } catch (error) {
      console.error("Failed to fetch online status:", error)
    } finally {
      setLoading(false)
    }
  }, [userIds])

  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    // Debounce the fetch request
    fetchTimeoutRef.current = setTimeout(() => {
      fetchOnlineStatus()
    }, 500) // 500ms delay

    // Refresh online status every 45 seconds (reduced frequency)
    const interval = setInterval(fetchOnlineStatus, 45000)

    return () => {
      clearInterval(interval)
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
    }
  }, [fetchOnlineStatus])

  return { onlineStatus, loading, refetch: fetchOnlineStatus }
}
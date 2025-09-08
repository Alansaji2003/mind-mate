"use client"

import { useState, useEffect, useCallback } from "react"
import { authClient } from "@/lib/auth-client"

interface Conversation {
  id: string
  speakerName: string
  listenerName: string
  topic?: string
  startedAt: string
  isActive: boolean
  messageCount?: number
}

export function useActiveConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = authClient.useSession()

  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch("/api/conversations")
      if (!response.ok) {
        throw new Error("Failed to fetch conversations")
      }
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const endSession = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE"
      })
      if (!response.ok) {
        throw new Error("Failed to end session")
      }
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    } catch (err) {
      console.error("Error ending session:", err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    endSession,
    refetch: fetchConversations
  }
}
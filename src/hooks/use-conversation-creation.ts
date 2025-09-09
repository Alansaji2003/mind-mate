"use client"

import { useState, useCallback } from "react"
import { authClient } from "@/lib/auth-client"

interface CreateConversationParams {
  listenerId: string
  topic?: string
}

export function useConversationCreation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createConversation = useCallback(async ({ listenerId, topic }: CreateConversationParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listenerId, topic }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create conversation")
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createConversation,
    loading,
    error,
  }
}


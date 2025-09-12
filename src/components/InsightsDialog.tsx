"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, Loader2 } from "lucide-react"

interface InsightsDialogProps {
  isOpen: boolean
  onClose: () => void
  messages: any[]
  conversationId: string
}

export function InsightsDialog({
  isOpen,
  onClose,
  messages,
  conversationId,
}: InsightsDialogProps) {
  const [insights, setInsights] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  // Memoized generateInsights
  const generateInsights = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          conversationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.fallback) {
          setInsights(data.fallback)
        } else {
          throw new Error(data.error || "Failed to generate insights")
        }
      } else {
        setInsights(data.insights) // raw output without modification
      }
    } catch (err) {
      console.error("Error generating insights:", err)
      setError("Unable to generate insights at this time")
      // Compassionate fallback message
      setInsights(
        "Thank you for sharing your thoughts today. Every conversation is meaningful, and taking time to reflect on your experiences shows wisdom and self-awareness. Remember to be gentle with yourself as you process your feelings."
      )
    } finally {
      setLoading(false)
    }
  }, [messages, conversationId])

  // Trigger insights generation
  useEffect(() => {
    if (isOpen && messages.length > 0 && !insights && !loading) {
      generateInsights()
    }
  }, [isOpen, messages, insights, loading, generateInsights])

  // Scroll to top whenever new insights arrive
  useEffect(() => {
    if (!loading && insights) {
      const container = document.getElementById("insights-container")
      container?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [loading, insights])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <Heart className="h-5 w-5" />
            AI Reflections & Insights
          </DialogTitle>
          <DialogDescription>
            Here are some thoughtful reflections on your conversation today.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">
                Generating personalized insights...
              </span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div
              id="insights-container"
              className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto"
            >
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {insights}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
            Thank You
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

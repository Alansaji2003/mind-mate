"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface FeedbackItem {
  id: string
  rating: number
  comment?: string
  createdAt: string
  conversation: {
    id: string
    topic?: string
    listener: {
      user: {
        name: string
      }
    }
  }
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = authClient.useSession()

  useEffect(() => {
    async function fetchFeedbacks() {
      if (!session?.user?.id) return

      try {
        const response = await fetch("/api/feedback/history")
        if (response.ok) {
          const data = await response.json()
          setFeedbacks(data.feedbacks || [])
        }
      } catch (error) {
        console.error("Failed to fetch feedback history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedbacks()
  }, [session?.user?.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor"
      case 2: return "Fair"
      case 3: return "Good"
      case 4: return "Very Good"
      case 5: return "Excellent"
      default: return ""
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Feedback History</h1>
        <p className="text-gray-400">Loading feedback...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Feedback History</h1>
      
      {feedbacks.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No feedback submitted yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Your feedback will appear here after you complete conversations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    Conversation with {feedback.conversation.listener.user.name}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {getRatingText(feedback.rating)}
                  </Badge>
                </div>
                {feedback.conversation.topic && (
                  <p className="text-sm text-gray-400">
                    Topic: {feedback.conversation.topic}
                  </p>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= feedback.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      ({feedback.rating}/5)
                    </span>
                  </div>

                  {/* Comment */}
                  {feedback.comment && (
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Your feedback:</p>
                      <p className="text-sm text-gray-400 bg-gray-700 rounded p-3">
                        {feedback.comment}
                          </p>

                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    Submitted on {formatDate(feedback.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
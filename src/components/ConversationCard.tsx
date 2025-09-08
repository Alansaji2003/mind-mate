"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Clock, PhoneOff, User } from "lucide-react"

interface Conversation {
  id: string
  speakerName: string
  listenerName: string
  topic?: string
  startedAt: string
  isActive: boolean
  messageCount?: number
}

interface ConversationCardProps {
  conversation: Conversation
  currentUserRole: "SPEAKER" | "LISTENER"
  onEndSession?: (conversationId: string) => void
}

export function ConversationCard({ conversation, currentUserRole, onEndSession }: ConversationCardProps) {
  const [isEnding, setIsEnding] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleEndSession = async () => {
    if (!onEndSession) return
    
    setIsEnding(true)
    try {
      await onEndSession(conversation.id)
    } catch (error) {
      console.error("Failed to end session:", error)
      // Could add toast notification here instead of alert
    } finally {
      setIsEnding(false)
    }
  }

  const otherPersonName = currentUserRole === "SPEAKER" 
    ? conversation.listenerName 
    : conversation.speakerName

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-400" />
            <CardTitle className="text-lg text-white">
              Active Conversation
            </CardTitle>
            <Badge variant="secondary" className="bg-green-600 text-white">
              Live
            </Badge>
          </div>
          {currentUserRole === "SPEAKER" && onEndSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndSession}
              disabled={isEnding}
              className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              title="End Session"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-gray-300">
              <span className="font-medium text-white">With:</span>{" "}
              <span className="text-blue-300">{otherPersonName}</span>
            </p>
            {conversation.topic && (
              <p className="text-gray-300 mt-1">
                <span className="font-medium text-white">Topic:</span>{" "}
                <span className="text-purple-300">{conversation.topic}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Started {formatTimestamp(conversation.startedAt)}</span>
            {conversation.messageCount && (
              <>
                <span>•</span>
                <span>{conversation.messageCount} messages</span>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/chat/${conversation.id}`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                {currentUserRole === "SPEAKER" ? "Continue Chat" : "Join Conversation"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

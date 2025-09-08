"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react"

interface ConversationHistoryProps {
  conversationId: string
}

interface HistoryMessage {
  id: string
  content: string
  createdAt: string
  senderName: string
  isFromCurrentUser: boolean
}

interface ConversationData {
  id: string
  topic?: string
  startedAt: string
  messageCount: number
  messages: HistoryMessage[]
}

export function ConversationHistory({ conversationId }: ConversationHistoryProps) {
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/history`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data.conversation)
        }
      } catch (error) {
        console.error("Failed to fetch conversation history:", error)
      } finally {
        setLoading(false)
      }
    }

    if (conversationId) {
      fetchHistory()
    }
  }, [conversationId])

  if (loading) {
    return (
      <div className="p-3 border-b border-white/20 bg-black/20">
        <div className="animate-pulse text-sm text-gray-300">Loading conversation history...</div>
      </div>
    )
  }

  if (!conversation || conversation.messageCount === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="border-b border-white/20 bg-black/20">
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-white hover:bg-white/10"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Previous Messages ({conversation.messageCount})</span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {isExpanded && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            <div className="text-xs text-gray-400 mb-2">
              Conversation started: {formatDate(conversation.startedAt)}
              {conversation.topic && <div>Topic: {conversation.topic}</div>}
            </div>
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`text-xs p-2 rounded ${
                  message.isFromCurrentUser
                    ? "bg-purple-600/30 text-white ml-4"
                    : "bg-gray-600/30 text-gray-200 mr-4"
                }`}
              >
                <div className="font-medium text-xs opacity-70 mb-1">
                  {message.senderName} • {formatDate(message.createdAt)}
                </div>
                <div>{message.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
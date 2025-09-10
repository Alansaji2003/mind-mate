"use client"

import { useChat } from "@/hooks/use-chat"
import { ChatBubble } from "@/components/ChatBubble"
import { ConversationHistory } from "@/components/ConversationHistory"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { InsightsDialog } from "@/components/InsightsDialog"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { PhoneOff } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"

export default function ChatPage() {
  const { data: session, isPending } = authClient.useSession()
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const sessionId = params?.sessionId || ""
  const userId = session?.user?.id || ""

  const [userRole, setUserRole] = useState<"SPEAKER" | "LISTENER" | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [conversationData, setConversationData] = useState<{ listenerName: string; isActive: boolean } | null>(null)
  const [conversationEnded, setConversationEnded] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [input, setInput] = useState("")

  const { clearNotificationsForConversation } = useNotifications()
  const { messages, loading, sendMessage, sessionEnded, connectionState } = useChat(sessionId, userId)

  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(messages.length)

  // Fetch user role and conversation data
  useEffect(() => {
    if (!userId || !sessionId) return

    // Get user role
    fetch("/api/user/find_role")
      .then(res => res.json())
      .then(data => setUserRole(data.role))
      .catch(console.error)

    // Get conversation data
    fetch(`/api/conversations/${sessionId}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            setConversationEnded(true)
            return null
          }
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (data) {
          setConversationData({ listenerName: data.listenerName, isActive: data.isActive })
          if (!data.isActive) setConversationEnded(true)
        }
      })
      .catch(console.error)
  }, [userId, sessionId])

  // Clear notifications on session end
  useEffect(() => {
    if (sessionEnded && sessionId) {
      clearNotificationsForConversation(sessionId)
    }
  }, [sessionEnded, sessionId, clearNotificationsForConversation])

  // Handle session end redirects and feedback
  useEffect(() => {
    if (!sessionEnded) return

    if (userRole === "SPEAKER" && conversationData && !showFeedback && !showInsights) {
      setShowInsights(true)
    } else if (userRole === "LISTENER") {
      setTimeout(() => router.push("/dashboard"), 3000)
    } else if (userRole === "SPEAKER" && !conversationData) {
      setTimeout(() => router.push("/dashboard/listeners"), 3000)
    }
  }, [sessionEnded, userRole, conversationData, showFeedback, showInsights, router])

  // Handle accessing already ended conversation
  useEffect(() => {
    if (!conversationEnded) return
    setTimeout(() => router.push("/dashboard"), 3000)
  }, [conversationEnded, router])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMsgCount.current = messages.length
  }, [messages])

  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this session? This action cannot be undone.")) return
    setIsEnding(true)
    try {
      const res = await fetch(`/api/conversations/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to end session")
    } catch (err) {
      console.error(err)
    } finally {
      setIsEnding(false)
    }
  }

  const handleFeedbackSubmit = async (rating: number, comment?: string) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: sessionId, rating, comment }),
      })
      if (!res.ok) throw new Error("Failed to submit feedback")
      router.push("/dashboard/listeners")
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const handleFeedbackClose = () => {
    setShowFeedback(false)
    router.push("/dashboard/listeners")
  }

  const handleInsightsClose = () => {
    setShowInsights(false)
    if (userRole === "SPEAKER" && conversationData) setShowFeedback(true)
    else router.push("/dashboard")
  }

  if (isPending || !sessionId || !userId) return <p>Loading chat...</p>
  if (loading) return <p>Loading messages...</p>

  return (
    <div className="flex h-screen flex-col relative overflow-hidden">
      {/* Session Ended Overlay */}
      {(sessionEnded || conversationEnded) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Ended</h2>
            <p className="text-gray-600 mb-4">
              The conversation has ended. You will be redirected shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Header with End Session button */}
      {userRole === "SPEAKER" && !conversationEnded && (
        <div className="flex justify-between items-center p-2 sm:p-4 border-b border-white/20 bg-black/50">
          <h1 className="text-lg font-semibold text-white">Chat Session</h1>
          <Button onClick={handleEndSession} disabled={isEnding} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
            <PhoneOff className="h-4 w-4 mr-2" />
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        </div>
      )}

      {/* Conversation History */}
      {!conversationEnded && <ConversationHistory conversationId={sessionId} />}

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {!conversationEnded && messages.map(msg => (
          <ChatBubble key={msg.$id} message={msg.content} senderId={msg.senderId} currentUserId={userId} createdAt={msg.$createdAt} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!input.trim() || sessionEnded || conversationEnded) return
          sendMessage(input)
          setInput("")
        }}
        className="flex gap-2 p-2 sm:p-3 border-t border-white/20 bg-black/50"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={sessionEnded || conversationEnded}
          placeholder={sessionEnded || conversationEnded ? "Session ended..." : "Type a message..."}
          className="flex-1 rounded-lg border px-3 py-2 text-black bg-white disabled:bg-gray-200 disabled:cursor-not-allowed text-base"
        />
        <button type="submit" disabled={sessionEnded || conversationEnded} className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
          Send
        </button>
      </form>

      {/* Feedback Dialog */}
      {showFeedback && conversationData && (
        <FeedbackDialog isOpen={showFeedback} onClose={handleFeedbackClose} onSubmit={handleFeedbackSubmit} listenerName={conversationData.listenerName} />
      )}

      {/* Insights Dialog */}
      {showInsights && <InsightsDialog isOpen={showInsights} onClose={handleInsightsClose} messages={messages} conversationId={sessionId} />}
    </div>
  )
}

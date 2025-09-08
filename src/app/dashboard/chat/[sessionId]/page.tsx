"use client"

import { useChat } from "@/hooks/use-chat"
import { ChatBubble } from "@/components/ChatBubble"
import { ConversationHistory } from "@/components/ConversationHistory"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { PhoneOff } from "lucide-react"

export default function ChatPage() {
  const { data: session, isPending } = authClient.useSession()
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const sessionId = params?.sessionId || ""
  const userId = session?.user?.id || ""

  const [input, setInput] = useState("")
  const [isEnding, setIsEnding] = useState(false)
  const [userRole, setUserRole] = useState<"SPEAKER" | "LISTENER" | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [conversationData, setConversationData] = useState<{
    listenerName: string
  } | null>(null)

  const { messages, loading, sendMessage, sessionEnded } = useChat(sessionId, userId, userRole)

  // 🔊 Track previous message count
  const prevMsgCount = useRef(messages.length)

  // 📜 Ref for auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null)

  // Handle session end and feedback flow
  useEffect(() => {
    if (sessionEnded && userRole === "SPEAKER" && conversationData && !showFeedback) {
      // Show feedback dialog for speakers when session ends
      setShowFeedback(true)
    } else if (sessionEnded && userRole === "LISTENER") {
      // Listeners go directly to dashboard when session ends
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } else if (sessionEnded && userRole === "SPEAKER" && !conversationData) {
      // If speaker but no conversation data, redirect after delay
      setTimeout(() => {
        router.push("/dashboard/listeners")
      }, 3000)
    }
  }, [sessionEnded, userRole, conversationData, showFeedback, router])

  // Get user role and conversation data
  useEffect(() => {
    if (userId && sessionId) {
      // Get user role
      fetch("/api/user/find_role")
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(console.error)

      // Get conversation data for feedback
      fetch(`/api/conversations/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setConversationData({
            listenerName: data.listenerName
          })
        })
        .catch(console.error)
    }
  }, [userId, sessionId])

  // Auto-end session when speaker navigates away
  useEffect(() => {
    if (userRole === "SPEAKER" && sessionId) {
      const handleBeforeUnload = async () => {
        // End the session when speaker leaves
        try {
          await fetch(`/api/conversations/${sessionId}`, {
            method: "DELETE",
            keepalive: true // Ensure request completes even if page is closing
          })
        } catch (error) {
          console.error("Failed to auto-end session:", error)
        }
      }



      // End session when page unloads (navigation, refresh, close)
      window.addEventListener("beforeunload", handleBeforeUnload)

      // Optional: End session when tab becomes hidden
      // document.addEventListener("visibilitychange", handleVisibilityChange)

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload)
        // document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [userRole, sessionId])

  const handleEndSession = async () => {
    // Use a more user-friendly confirmation
    const confirmed = window.confirm("Are you sure you want to end this session? This action cannot be undone.")
    if (!confirmed) return

    setIsEnding(true)
    try {
      const response = await fetch(`/api/conversations/${sessionId}`, {
        method: "DELETE"
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to end session")
      }
      
      // The session end will be handled by the useEffect that watches for sessionEnded
      // No need to manually show feedback or redirect here
    } catch (error) {
      console.error("Error ending session:", error)
      // Could add toast notification here instead of alert
      const errorMessage = error instanceof Error ? error.message : "Failed to end session. Please try again."
      // For now, we'll use a more subtle approach - just log and let user retry
      console.warn("Session end failed:", errorMessage)
    } finally {
      setIsEnding(false)
    }
  }

  const handleFeedbackSubmit = async (rating: number, comment?: string) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: sessionId,
          rating,
          comment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit feedback")
      }

      // Redirect to listeners page after feedback
      router.push("/dashboard/listeners")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      // Error is handled by FeedbackDialog with toast
      throw error
    }
  }

  const handleFeedbackClose = () => {
    setShowFeedback(false)
    // Redirect even if they skip feedback
    router.push("/dashboard/listeners")
  }

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const lastMsg = messages[messages.length - 1]

      // ✅ Play sound if new message is from others
      if (lastMsg.senderId !== userId) {
        const audio = new Audio("/notification.mp3") // put file in /public
        audio.play().catch(() => { })
      }

      // ✅ Flash title if tab not focused
      if (document.hidden && lastMsg.senderId !== userId) {
        const originalTitle = document.title
        let flash = true
        const interval = setInterval(() => {
          document.title = flash ? "🔔 New Message!" : originalTitle
          flash = !flash
        }, 1000)

        const stopFlashing = () => {
          clearInterval(interval)
          document.title = originalTitle
          document.removeEventListener("visibilitychange", stopFlashing)
        }

        document.addEventListener("visibilitychange", stopFlashing)
      }
    }

    prevMsgCount.current = messages.length

    // 📜 Always scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, userId])

  if (isPending || !sessionId || !userId) return <p>Loading chat...</p>
  if (loading) return <p>Loading chat messages...</p>

  return (
    <div className="flex h-screen flex-col relative overflow-hidden">
      {/* Session Ended Overlay - Only show for listeners or speakers without feedback dialog */}
      {sessionEnded && (userRole === "LISTENER" || (userRole === "SPEAKER" && !conversationData)) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Ended</h2>
            <p className="text-gray-600 mb-4">
              The conversation has been ended. You will be redirected shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Header with End Session button for speakers */}
      {userRole === "SPEAKER" && (
        <div className="flex justify-between items-center p-2 sm:p-4 border-b border-white/20 bg-black/50">
          <h1 className="text-lg font-semibold text-white">Chat Session</h1>
          <Button
            onClick={handleEndSession}
            disabled={isEnding}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            {isEnding ? "Ending..." : "End Session"}
          </Button>
        </div>
      )}

      {/* Conversation History */}
      <ConversationHistory conversationId={sessionId} />

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.$id}
            message={msg.content}
            senderId={msg.senderId}
            currentUserId={userId}
            createdAt={msg.$createdAt}
          />
        ))}
        {/* 📜 Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim() || sessionEnded) return
          sendMessage(input)
          setInput("")
        }}
        className="flex gap-2 p-2 sm:p-3 border-t border-white/20 bg-black/50"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sessionEnded}
          className="flex-1 rounded-lg border px-3 py-2 text-black bg-white disabled:bg-gray-200 disabled:cursor-not-allowed text-base"
          placeholder={sessionEnded ? "Session ended..." : "Type a message..."}
        />
        <button
          type="submit"
          disabled={sessionEnded}
          className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {/* Feedback Dialog */}
      {showFeedback && conversationData && (
        <FeedbackDialog
          isOpen={showFeedback}
          onClose={handleFeedbackClose}
          onSubmit={handleFeedbackSubmit}
          listenerName={conversationData.listenerName}
        />
      )}
    </div>
  )
}

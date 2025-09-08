"use client"

import { useActiveConversations } from "@/hooks/use-conversations"
import { ConversationCard } from "@/components/ConversationCard"
import { authClient } from "@/lib/auth-client"
import { useEffect, useState } from "react"

export function ActiveConversations() {
  const { conversations, loading, error, endSession } = useActiveConversations()
  const { data: session } = authClient.useSession()
  const [userRole, setUserRole] = useState<"SPEAKER" | "LISTENER" | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/find_role")
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(console.error)
    }
  }, [session?.user?.id])

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Active Conversations</h2>
        <p className="text-gray-400">Loading conversations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Active Conversations</h2>
        <p className="text-red-400">Error loading conversations: {error}</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Active Conversations</h2>
        <p className="text-gray-400">No active conversations</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-white mb-4">Active Conversations</h2>
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            currentUserRole={userRole || "LISTENER"}
            onEndSession={userRole === "SPEAKER" ? endSession : undefined}
          />
        ))}
      </div>
    </div>
  )
}

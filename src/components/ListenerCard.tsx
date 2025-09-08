"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConversationCreation } from "@/hooks/use-conversation-creation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Listener {
  id: string
  userId?: string
  name: string
  topics: string[]
  rating: number
  trust: number
  badges: string[]
  isAvailable?: boolean
  isOnline?: boolean
  availability: AvailabilitySlot[]
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function ListenerCard({ listener }: { listener: Listener }) {
  const router = useRouter()
  const { createConversation, loading } = useConversationCreation()
  const [topic, setTopic] = useState("")

  const handleConnect = async () => {
    try {
      const result = await createConversation({
        listenerId: listener.id,
        topic: topic.trim() || undefined
      })

      // Navigate to the chat with the created conversation ID
      router.push(`/dashboard/chat/${result.conversation.id}`)
    } catch (error) {
      console.error("Failed to start conversation:", error)
      // You might want to show a toast notification here
    }
  }

  return (
    <div className="rounded-lg border border-gray-700 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{listener.name}</h2>
        <div className="flex items-center gap-2">
          {/* Online Status Dot */}
          <span
            className={`h-3 w-3 rounded-full ${listener.isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            title={listener.isOnline ? "Online now" : "Offline"}
          />
          {/* Availability Status */}
          {listener.isAvailable && (
            <span
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full"
              title="Available according to schedule"
            >
              Available
            </span>
          )}
        </div>
      </div>

      {/* Topics */}
      <p className="text-gray-400 text-sm mb-1">
        <span className="font-medium text-white">Topics:</span>{" "}
        {listener.topics.join(", ")}
      </p>

      {/* Rating & Trust */}
      <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
        <span>⭐ {listener.rating.toFixed(1)} / 5</span>
        <span>Trust: {listener.trust}%</span>
      </div>

      {/* Badges */}
      {listener.badges.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {listener.badges.map((badge, i) => (
            <span
              key={i}
              className="rounded-full bg-gray-700 px-2 py-0.5 text-xs"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Availability Schedule */}
      {listener.availability?.length > 0 && (
        <div className="text-xs text-gray-400 mb-3 space-y-1">
          <p className="font-medium text-white">Availability:</p>
          {listener.availability.map((slot, i) => (
            <p key={i}>
              {days[slot.dayOfWeek]}{" "}
              {new Date(slot.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(slot.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ))}
        </div>
      )}

      {/* Topic Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="What would you like to discuss?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Connect Button */}
      <div className="mt-auto">
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </div>
  )
}

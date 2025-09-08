"use client"

import { cn } from "@/lib/utils"

interface ChatBubbleProps {
  message: string
  senderId: string
  currentUserId: string
  createdAt: string // still passed in, but now it’s $createdAt
}

export function ChatBubble({
  message,
  senderId,
  currentUserId,
  createdAt,
}: ChatBubbleProps) {
  const isOwn = senderId === currentUserId

  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-4 py-2 text-sm shadow-md",
          isOwn
            ? "bg-purple-600 text-white"
            : "bg-white/10 text-white"
        )}
      >
        <p>{message}</p>
        <span className="mt-1 block text-xs opacity-60">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MessageCircle, Clock } from "lucide-react"

interface Notification {
  id: string
  conversationId: string
  speakerName: string
  topic?: string
  timestamp: string
  isRead: boolean
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
}

export function NotificationCard({ notification, onMarkAsRead, onRemove }: NotificationCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const handleJoinConversation = () => {
    onMarkAsRead(notification.id)
  }

  return (
    <Card 
      className={`transition-all duration-200 ${
        notification.isRead 
          ? "bg-gray-800/50 border-gray-700" 
          : "bg-blue-900/20 border-blue-600 shadow-lg shadow-blue-500/10"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg text-white">
              New Chat Session
            </CardTitle>
            {!notification.isRead && (
              <Badge variant="secondary" className="bg-blue-600 text-white">
                New
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(notification.id)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="text-gray-300">
              <span className="font-medium text-white">{notification.speakerName}</span>{" "}
              started a conversation
              {notification.topic && (
                <>
                  {" "}about{" "}
                  <span className="font-medium text-blue-300">{notification.topic}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatTimestamp(notification.timestamp)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/chat/${notification.conversationId}`}>
              <Button 
                onClick={handleJoinConversation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Join Conversation
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

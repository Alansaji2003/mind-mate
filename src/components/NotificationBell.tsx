"use client"

import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    connectionFailed,
    retryConnection,
  } = useNotifications()

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-hidden">
        <div className="sticky top-0 z-10  p-2 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-medium text-sm">New Chat Sessions</h4>
          {connectionFailed && (
            <Button
              size="sm"
              variant="outline"
              onClick={retryConnection}
              className="h-6 px-2 text-xs text-orange-600 border-orange-200"
            >
              Retry
            </Button>
          )}
        </div>

        {connectionFailed && (
          <div className="p-2 bg-orange-50 border border-orange-200 text-xs text-orange-700">
            Real-time notifications unavailable. Retry or refresh the page.
          </div>
        )}

        <div className="space-y-2 overflow-y-auto max-h-80 p-2">
          {notifications.length === 0 ? (
            <p className="text-center text-xs text-gray-500">No new notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-2 rounded-md border cursor-pointer hover:shadow-sm transition ${
                  notif.isRead ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notif.speakerName}</p>
                    <p className="text-xs text-gray-600">
                      {notif.topic ? `Topic: ${notif.topic}` : "Started a conversation"}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimestamp(notif.timestamp)}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Link href={`/dashboard/chat/${notif.conversationId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notif.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Join
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeNotification(notif.id)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

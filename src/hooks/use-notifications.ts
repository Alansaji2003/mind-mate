"use client"

import { useState, useEffect, useCallback } from "react"
import { authClient } from "@/lib/auth-client"
import { Client } from "appwrite"
import { env } from "@/lib/env"
import { updateConnectionStatus } from "./use-connection-status"

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

interface Notification {
  id: string
  conversationId: string
  speakerName: string
  topic?: string
  timestamp: string
  isRead: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connectionFailed, setConnectionFailed] = useState(false)
  const { data: session } = authClient.useSession()

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Subscribe to real-time message notifications for new conversations
  useEffect(() => {
    if (!session?.user?.id) return

    let unsubscribe: (() => void) | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    const connect = () => {
      try {
        unsubscribe = client.subscribe(
          `databases.${env.NEXT_PUBLIC_APPWRITE_DB_ID}.collections.${env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION}.documents`,
          (response) => {
            // Reset reconnect attempts on successful connection
            reconnectAttempts = 0
            updateConnectionStatus("connected", 0)
            
            const event = response.events[0]
            const message = response.payload as any

            if (event.includes("create") && message.sessionId && message.senderId !== session.user.id) {
              console.log("🔔 Message received:", message.content, "from:", message.senderId)
              
              // Check if current user is a listener first
              fetch("/api/user/find_role")
                .then(res => res.json())
                .then(roleData => {
                  if (roleData.role === "LISTENER" && roleData.profileId) {
                    // For any message from another user, check if this listener should be notified
                    // First check if current user is the intended listener for this conversation
                    fetch(`/api/notifications/conversation-info?conversationId=${message.sessionId}&userId=${session.user.id}`)
                      .then(res => {
                        if (!res.ok) {
                          // If not authorized (403), this user is not the intended listener
                          if (res.status === 403) {
                            return null
                          }
                          throw new Error(`HTTP ${res.status}`)
                        }
                        return res.json()
                      })
                      .then(conversationData => {
                        // If conversationData is null, user is not the intended listener
                        if (conversationData) {
                          // Only create notification for connection messages
                          if (message.content && message.content.startsWith("Connected")) {
                            console.log("✅ Creating notification for:", message.content)
                            
                            // Don't create notification if user is already in this conversation
                            const currentPath = window.location.pathname
                            if (currentPath.includes(`/chat/${message.sessionId}`)) {
                              console.log("⚠️ User already in conversation, skipping notification")
                              return
                            }
                            // Extract topic from message content
                            let extractedTopic: string | undefined
                            if (message.content.includes("discuss:")) {
                              extractedTopic = message.content.split("discuss:")[1]?.trim()
                            }

                            const newNotification: Notification = {
                              id: message.$id,
                              conversationId: message.sessionId,
                              speakerName: "Anonymous Speaker", // Always anonymous
                              topic: extractedTopic,
                              timestamp: message.$createdAt,
                              isRead: false
                            }

                            setNotifications(prev => {
                              // Check if notification already exists to prevent duplicates
                              const existsById = prev.some(n => n.id === newNotification.id)
                              if (existsById) {
                                console.log("⚠️ Duplicate notification prevented (same ID):", newNotification.id)
                                return prev
                              }
                              
                              // Also check for recent notifications from the same conversation (within last 30 seconds)
                              const now = new Date()
                              const recentFromSameConversation = prev.some(n => {
                                const notifTime = new Date(n.timestamp)
                                const timeDiff = now.getTime() - notifTime.getTime()
                                return n.conversationId === newNotification.conversationId && timeDiff < 30000
                              })
                              
                              if (recentFromSameConversation) {
                                console.log("⚠️ Recent notification from same conversation prevented:", newNotification.conversationId)
                                return prev
                              }
                              
                              console.log("➕ Adding new notification:", newNotification.id)
                              return [newNotification, ...prev]
                            })
                            setUnreadCount(prev => prev + 1)

                            // Play notification sound
                            const audio = new Audio("/notification.mp3")
                            audio.play().catch(() => { })

                            // Show browser notification if permission granted
                            if (Notification.permission === "granted") {
                              new Notification("New Chat Session", {
                                body: `Someone started a conversation${newNotification.topic ? ` about ${newNotification.topic}` : ""}`,
                                icon: "/favicon.ico"
                              })
                            }
                          }
                        }
                      })
                      .catch(error => {
                        console.warn("Failed to fetch conversation details:", error)
                      })
                  }
                })
                .catch(error => {
                  console.warn("Failed to fetch user role:", error)
                })
            }
          }
        )
        
        // Monitor connection health with a timeout (only for first connection)
        let connectionTimeout: NodeJS.Timeout | null = null
        if (reconnectAttempts === 0) {
          connectionTimeout = setTimeout(() => {
            console.warn("Initial notifications connection timeout - attempting reconnect")
            handleConnectionError()
          }, 15000) // 15 second timeout for initial connection
        }
        
        // Clear timeout when we receive first message (connection successful)
        const originalUnsubscribe = unsubscribe
        let timeoutCleared = false
        unsubscribe = () => {
          if (!timeoutCleared && connectionTimeout) {
            clearTimeout(connectionTimeout)
            timeoutCleared = true
          }
          if (originalUnsubscribe) originalUnsubscribe()
        }
        
        // Function to handle connection errors
        const handleConnectionError = () => {
          updateConnectionStatus("disconnected", reconnectAttempts)
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            updateConnectionStatus("reconnecting", reconnectAttempts)
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
            
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
            reconnectTimeout = setTimeout(() => {
              console.log(`Attempting to reconnect notifications real-time... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
              connect()
            }, delay)
          } else {
            console.warn("Max reconnection attempts reached for notifications real-time. Notifications will work but may not be real-time.")
            updateConnectionStatus("disconnected", reconnectAttempts)
            setConnectionFailed(true)
          }
        }
      } catch (error) {
        console.error("Failed to establish notifications real-time connection:", error)
        updateConnectionStatus("disconnected", reconnectAttempts)
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          updateConnectionStatus("reconnecting", reconnectAttempts)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
          
          if (reconnectTimeout) clearTimeout(reconnectTimeout)
          reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect notifications real-time... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        } else {
          console.warn("Max reconnection attempts reached for notifications real-time. Notifications will work but may not be real-time.")
          updateConnectionStatus("disconnected", reconnectAttempts)
          setConnectionFailed(true)
        }
      }
    }

    connect()

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe()
        } catch (error) {
          console.warn("Error unsubscribing from notifications real-time:", error)
        }
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [session?.user?.id])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }, [])

  const clearNotificationsForConversation = useCallback((conversationId: string) => {
    setNotifications(prev => {
      const conversationNotifications = prev.filter(n => n.conversationId === conversationId)
      const unreadConversationNotifications = conversationNotifications.filter(n => !n.isRead)
      
      if (unreadConversationNotifications.length > 0) {
        setUnreadCount(prevCount => Math.max(0, prevCount - unreadConversationNotifications.length))
      }
      
      return prev.filter(n => n.conversationId !== conversationId)
    })
  }, [])

  const retryConnection = useCallback(() => {
    setConnectionFailed(false)
    // Force a re-render of the effect by updating session dependency
    // This will restart the connection process
    window.location.reload()
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotificationsForConversation,
    connectionFailed,
    retryConnection,
  }
}

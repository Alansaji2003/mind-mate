"use client"

import { useEffect, useState, useCallback } from "react"
import { Client, Databases, ID, Models, Query } from "appwrite"
import { env } from "@/lib/env"
import { updateConnectionStatus } from "./use-connection-status"

interface Message extends Models.Document {
  sessionId: string
  senderId: string
  content: string
  $createdAt: string
}

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

const databases = new Databases(client)

export function useChat(sessionId: string, userId: string, userRole?: "SPEAKER" | "LISTENER" | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionEnded, setSessionEnded] = useState(false)

  // Always fetch messages whenever sessionId changes
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    async function loadMessages() {
      if (!sessionId) return
      try {
        const res = await databases.listDocuments<Message>(
          env.NEXT_PUBLIC_APPWRITE_DB_ID,
          env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
          [
            Query.equal("sessionId", sessionId),
            Query.orderAsc("$createdAt"),
          ]
        )
        if (isMounted) setMessages(res.documents)
      } catch (err) {
        console.error("[useChat] Failed to load messages:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return

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
            const message = response.payload as unknown as Message

            if (!message || message.sessionId !== sessionId) return

            setMessages((prev) => {
              if (event.includes("create")) {
                // Check if this is a session end message
                if (message.content === "SESSION_ENDED" && message.senderId === "SYSTEM") {
                  setSessionEnded(true)
                  // Don't auto-redirect - let the chat page handle it based on feedback completion
                  // Don't add system messages to the chat
                  return prev
                }
                // Check if message already exists to prevent duplicates
                const exists = prev.some(m => m.$id === message.$id)
                if (exists) return prev
                return [...prev, message]
              }
              if (event.includes("delete")) return prev.filter((m) => m.$id !== message.$id)
              if (event.includes("update"))
                return prev.map((m) => (m.$id === message.$id ? message : m))
              return prev
            })
          }
        )
        
        // Monitor connection health with a timeout
        const connectionTimeout = setTimeout(() => {
          // If we haven't received any messages after subscription, assume connection failed
          console.warn("Chat connection timeout - attempting reconnect")
          handleConnectionError()
        }, 10000) // 10 second timeout
        
        // Clear timeout when we receive first message (connection successful)
        const originalUnsubscribe = unsubscribe
        let timeoutCleared = false
        unsubscribe = () => {
          if (!timeoutCleared) {
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
              console.log(`Attempting to reconnect chat real-time... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
              connect()
            }, delay)
          } else {
            console.error("Max reconnection attempts reached for chat real-time")
            updateConnectionStatus("disconnected", reconnectAttempts)
          }
        }
      } catch (error) {
        console.error("Failed to establish chat real-time connection:", error)
        updateConnectionStatus("disconnected", reconnectAttempts)
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          updateConnectionStatus("reconnecting", reconnectAttempts)
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
          
          if (reconnectTimeout) clearTimeout(reconnectTimeout)
          reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect chat real-time... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        } else {
          updateConnectionStatus("disconnected", reconnectAttempts)
        }
      }
    }

    connect()

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe()
        } catch (error) {
          console.warn("Error unsubscribing from chat real-time:", error)
        }
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [sessionId, userRole])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !userId || !sessionId) return

      try {
        await databases.createDocument(
          env.NEXT_PUBLIC_APPWRITE_DB_ID,
          env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
          ID.unique(),
          {
            sessionId,
            senderId: userId,
            content,
          }
        )
      } catch (err) {
        console.error("[useChat] Failed to send message:", err)
      }
    },
    [sessionId, userId]
  )

  return { messages, loading, sendMessage, sessionEnded }
}

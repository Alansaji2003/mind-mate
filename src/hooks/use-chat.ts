"use client"

import { useEffect, useState, useCallback } from "react"
import { Client, Databases, ID, Models, Query } from "appwrite"
import { env } from "@/lib/env"

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

export function useChat(sessionId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectionState, setConnectionState] = useState<"connected" | "disconnected" | "reconnecting">("connected")

  // Fetch messages initially
  useEffect(() => {
    if (!sessionId) return
    let mounted = true
    setLoading(true)

    const loadMessages = async () => {
      try {
        const res = await databases.listDocuments<Message>(
          env.NEXT_PUBLIC_APPWRITE_DB_ID,
          env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
          [Query.equal("sessionId", sessionId), Query.orderAsc("$createdAt")]
        )
        if (mounted) setMessages(res.documents)
      } catch (err) {
        console.error("[useChat] Failed to load messages:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMessages()
    return () => { mounted = false }
  }, [sessionId])

  // Real-time subscription
  useEffect(() => {
    if (!sessionId) return
    let unsubscribe: (() => void) | null = null

    const connect = () => {
      setConnectionState("reconnecting")
      try {
        unsubscribe = client.subscribe(
          `databases.${env.NEXT_PUBLIC_APPWRITE_DB_ID}.collections.${env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION}.documents`,
          (res) => {
            const event = res.events[0]
            const msg = res.payload as unknown as Message
            if (!msg || msg.sessionId !== sessionId) return

            if (event.includes("create")) {
              if (msg.content === "SESSION_ENDED" && msg.senderId === "SYSTEM") {
                setSessionEnded(true)
                return
              }
              setMessages((prev) => prev.some((m) => m.$id === msg.$id) ? prev : [...prev, msg])
            }
            if (event.includes("delete")) setMessages((prev) => prev.filter((m) => m.$id !== msg.$id))
            if (event.includes("update")) setMessages((prev) => prev.map((m) => (m.$id === msg.$id ? msg : m)))
            setConnectionState("connected")
          }
        )
      } catch (err) {
        console.error("[useChat] Real-time subscription failed:", err)
        setConnectionState("disconnected")
      }
    }

    connect()
    return () => { if (unsubscribe) unsubscribe() }
  }, [sessionId])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !userId || !sessionId) return
    try {
      await databases.createDocument(
        env.NEXT_PUBLIC_APPWRITE_DB_ID,
        env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION,
        ID.unique(),
        { sessionId, senderId: userId, content }
      )
    } catch (err) {
      console.error("[useChat] Failed to send message:", err)
    }
  }, [sessionId, userId])

  return { messages, loading, sendMessage, sessionEnded, connectionState }
}

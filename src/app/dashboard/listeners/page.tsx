"use client"

import { useEffect, useState } from "react"
import { ListenerCard } from "@/components/ListenerCard"
import { usePresence, useOnlineStatus } from "@/hooks/use-presence"

interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Listener {
  id: string
  userId: string
  name: string
  topics: string[]
  rating: number
  trust: number
  badges: string[]
  isAvailable: boolean
  availability: AvailabilitySlot[]
}

export default function ListenersPage() {
  const [listeners, setListeners] = useState<Listener[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track current user's presence
  usePresence()
  
  // Get online status for all listeners (only when listeners are loaded)
  const userIds = listeners.map(l => l.userId)
  const { onlineStatus } = useOnlineStatus(listeners.length > 0 ? userIds : [])

  useEffect(() => {
    async function fetchListeners() {
      try {
        const res = await fetch("/api/listeners")
        if (!res.ok) throw new Error("Failed to fetch listeners")
        const data = await res.json()
        setListeners(data)
      } catch (err) {
        console.error(err)
        setError("Could not load listeners. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchListeners()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Loading listeners...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 text-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Available Listeners</h1>
        <p className="text-gray-400 max-w-2xl">
          Choose a listener who matches your interests. Their availability schedule
          is shown below, and the dot indicates if they are online right now.
        </p>

        {listeners.length === 0 ? (
          <p className="text-gray-400">No listeners are available right now. Check back later!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listeners.map((listener) => (
              <ListenerCard 
                key={listener.id} 
                listener={{
                  ...listener,
                  isOnline: onlineStatus[listener.userId] || false
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

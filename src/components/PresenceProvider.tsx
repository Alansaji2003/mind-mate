"use client"

import { ReactNode, memo } from "react"
import { usePresence } from "@/hooks/use-presence"

interface PresenceProviderProps {
  children: ReactNode
}

export const PresenceProvider = memo(function PresenceProvider({ children }: PresenceProviderProps) {
  // This will automatically track presence for any authenticated user
  usePresence()
  
  return <>{children}</>
})
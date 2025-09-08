"use client"

import { useConnectionStatus } from "@/hooks/use-connection-status"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RotateCcw } from "lucide-react"

export function ConnectionStatus() {
  const { status, reconnectAttempts } = useConnectionStatus()

  if (status === "connected") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    )
  }

  if (status === "reconnecting") {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
        Reconnecting{reconnectAttempts > 0 && ` (${reconnectAttempts})`}
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="h-3 w-3 mr-1" />
      Disconnected
    </Badge>
  )
}
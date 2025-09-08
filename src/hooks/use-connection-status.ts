"use client"

import { useState, useEffect } from "react"

type ConnectionStatus = "connected" | "disconnected" | "reconnecting"

// Global connection status that can be updated by other hooks
let globalConnectionStatus: ConnectionStatus = "disconnected"
let globalReconnectAttempts = 0
const statusListeners = new Set<(status: ConnectionStatus, attempts: number) => void>()

// Functions to update global status (called by chat/notification hooks)
export const updateConnectionStatus = (status: ConnectionStatus, attempts: number = 0) => {
    globalConnectionStatus = status
    globalReconnectAttempts = attempts
    statusListeners.forEach(listener => listener(status, attempts))
}

export function useConnectionStatus() {
    const [status, setStatus] = useState<ConnectionStatus>(globalConnectionStatus)
    const [reconnectAttempts, setReconnectAttempts] = useState(globalReconnectAttempts)

    useEffect(() => {
        // Listen for status updates from other hooks
        const listener = (newStatus: ConnectionStatus, attempts: number) => {
            setStatus(newStatus)
            setReconnectAttempts(attempts)
        }

        statusListeners.add(listener)

        // Set initial status
        setStatus(globalConnectionStatus)
        setReconnectAttempts(globalReconnectAttempts)

        return () => {
            statusListeners.delete(listener)
        }
    }, [])

    return { status, reconnectAttempts }
}
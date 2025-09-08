"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SelectRoles() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const [validating, setValidating] = useState(true)
  const [settingRole, setSettingRole] = useState<"SPEAKER" | "LISTENER" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    async function checkRole() {
      if (!session?.user?.id) return

      try {
        const res = await fetch(`/api/user/profile?userId=${session.user.id}`)
        if (res.ok) {
          const profile = await res.json()
      
          if (profile?.role === "SPEAKER") {
            router.replace("/dashboard/listeners")
            return // ✅ stop here, don’t release buttons
          } else if (profile?.role === "LISTENER") {
            router.replace("/dashboard")
            return
          }
        }
      } catch (err) {
        console.error("[SelectRoles] Error fetching profile:", err)
      } finally {
        setValidating(false) 
      }
      
    }

    if (!isPending) {
      checkRole()
    }
  }, [session, isPending, router])

  async function setRole(role: "SPEAKER" | "LISTENER") {
    if (!session?.user?.id || isProcessing || settingRole) return

    try {
      setSettingRole(role)
      setIsProcessing(true)
      
      const res = await fetch("/api/user/set_role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, role }),
      })

      if (res.ok) {
        // Keep buttons disabled during redirect
        if (role === "SPEAKER") {
          router.replace("/dashboard/listeners")
        } else {
          router.replace("/dashboard")
        }
      } else {
        // Handle API errors
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
        console.error("[SelectRoles] API Error:", errorData)
        toast.error(errorData.error || "Failed to set role. Please try again.")
        // Reset states on error so user can try again
        setSettingRole(null)
        setIsProcessing(false)
      }
    } catch (err) {
      console.error("[SelectRoles] Error setting role:", err)
      // Reset states on error so user can try again
      setSettingRole(null)
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-700 via-purple-800 to-black text-center px-4">
      <h2 className="text-2xl font-semibold mb-6 text-white">Choose your role</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setRole("SPEAKER")}
          className="px-6 py-3 text-base font-medium"
          disabled={isPending || validating || isProcessing}
        >
          {settingRole === "SPEAKER" ? "Setting up..." : "I would like to share"}
        </Button>

        <Button
          onClick={() => setRole("LISTENER")}
          variant="outline"
          className="px-6 py-3 text-base font-medium bg-white/10 text-white border-white hover:bg-white/20"
          disabled={isPending || validating || isProcessing}
        >
          {settingRole === "LISTENER" ? "Setting up..." : "I want to listen"}
        </Button>
      </div>
      
      {isProcessing && (
        <p className="mt-4 text-sm text-gray-300">
          Setting up your profile, please wait...
        </p>
      )}
    </div>
  )
}

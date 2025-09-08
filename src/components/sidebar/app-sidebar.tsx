"use client"

import Logo from "@/assets/logosaas.png"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LayoutDashboardIcon, ListIcon, BarChartIcon, UserIcon, Loader2 } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const listenerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Edit Information", url: "/dashboard/listener_form", icon: UserIcon },
]

const speakerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Find Listeners", url: "/dashboard/listeners", icon: ListIcon },
  { title: "Feedbacks", url: "/dashboard/feedback", icon: BarChartIcon },
]

type Role = "LISTENER" | "SPEAKER"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending } = authClient.useSession()
  const [role, setRole] = useState<Role | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    async function fetchRole(userId: string) {
      try {
        const res = await fetch(`/api/user/find_role?userId=${userId}`)
        if (!res.ok) throw new Error("Failed to fetch role")
        const data = (await res.json()) as { role?: Role }

        if (data.role === "LISTENER" || data.role === "SPEAKER") {
          setRole(data.role)
        } else {
          console.warn("Unknown role received:", data.role)
        }
      } catch (err) {
        console.error("[Sidebar] Role fetch error:", err)
      } finally {
        setLoadingRole(false)
      }
    }

    fetchRole(session.user.id)
  }, [session?.user?.id])

  // ✅ Unified loading state with spinner
  if (isPending || loadingRole) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading menu...</span>
      </div>
    )
  }

  const navMain = role === "LISTENER" ? listenerNav : speakerNav

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={Logo}
                  alt="MindMate Logo"
                  className="w-10 h-10 relative"
                  priority
                />
                <span className="text-base font-semibold">MINDMATE</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

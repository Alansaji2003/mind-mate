"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ListenerStats {
  avgRating: number
  totalRatings: number
  trustMeter: number
  badgesEarned: number
  topics: string[]
  availability: { dayOfWeek: number; startTime: string; endTime: string }[]
}

export function SectionCards() {
  const { data: session, isPending } = authClient.useSession()
  const [stats, setStats] = useState<ListenerStats | null>(null)
  const [role, setRole] = useState<"LISTENER" | "SPEAKER" | null>(null)

  useEffect(() => {
    if (!session?.user.id) return

    async function fetchStats() {
      try {
        const res = await fetch(`/api/listener/stats?userId=${session?.user.id}`)
        const data = await res.json()
        setRole(data.role)
        if (data.role === "LISTENER") setStats(data.stats)
      } catch (err) {
        console.error("Failed to fetch listener stats", err)
      }
    }

    fetchStats()
  }, [session?.user.id])

  if (isPending || !session?.user.id) return <p>Loading...</p>
  if (role !== "LISTENER" || !stats) return null

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Card 1: Average Rating */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Average Rating</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.avgRating.toFixed(1)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" /> +{stats.avgRating.toFixed(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total Feedbacks: {stats.totalRatings}
          </div>
        </CardFooter>
      </Card>

      {/* Card 2: Trust Meter */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Trust Meter</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.trustMeter}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" /> +{stats.trustMeter}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Badges Earned: {stats.badgesEarned}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3: Topics */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Listener Topics</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.topics.length}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-2">
            {stats.topics.length > 0 ? stats.topics.join(", ") : "No topics added"}
          </div>
        </CardFooter>
      </Card>

      {/* Card 4: Availability */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Availability Slots</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.availability.length}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {stats.availability.length > 0 ? (
            <ul className="list-disc pl-4">
              {stats.availability.map((slot, i) => (
                <li key={i}>
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                </li>
              ))}
            </ul>
          ) : (
            <div>No availability set</div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

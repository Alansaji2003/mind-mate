"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { authClient } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Activity
} from "lucide-react"

interface AnalyticsData {
  chartData: Array<{
    date: string
    conversations: number
    messages: number
    activeListeners?: number
    avgRating?: number
  }>
  summary: {
    totalConversations: number
    totalMessages: number
    avgRating?: number
    totalFeedback?: number
    totalListeners?: number
    topRatedListeners?: Array<{
      name: string
      rating: number
      totalRatings: number
    }>
  }
}

const chartConfig = {
  conversations: {
    label: "Conversations",
    color: "hsl(var(--chart-1))",
  },
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-2))",
  },
  activeListeners: {
    label: "Active Listeners",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { data: session } = authClient.useSession()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [userRole, setUserRole] = React.useState<"SPEAKER" | "LISTENER" | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Get user role
  React.useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/find_role")
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(console.error)
    }
  }, [session?.user?.id])

  // Fetch analytics data with debouncing
  React.useEffect(() => {
    if (!session?.user?.id) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
        const response = await fetch(`/api/analytics/listeners?days=${days}`, {
          // Add cache headers
          headers: {
            'Cache-Control': 'max-age=60' // Cache for 1 minute
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    // Debounce the analytics fetch
    const timeoutId = setTimeout(fetchAnalytics, 300)
    
    return () => clearTimeout(timeoutId)
  }, [session?.user?.id, timeRange])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="flex items-center gap-2 text-gray-400">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading analytics...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) {
    return (
      <Card className="@container/card">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No data available yet</p>
            <p className="text-sm">Start some conversations to see analytics!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isListener = userRole === "LISTENER"

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">
                  {isListener ? "Your Conversations" : "Total Conversations"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.summary.totalConversations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">
                  {isListener ? "Messages Sent" : "Total Messages"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {analyticsData.summary.totalMessages}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isListener ? (
          <>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Average Rating</p>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.summary.avgRating?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Feedback</p>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.summary.totalFeedback || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Listeners</p>
                    <p className="text-2xl font-bold text-white">
                      {analyticsData.summary.totalListeners || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Time Period</p>
                    <p className="text-2xl font-bold text-white">
                      {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"}d
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Chart */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardTitle>
            {isListener ? "Your Activity Over Time" : "Platform Activity"}
          </CardTitle>
          <CardDescription>
            <span className="@[540px]/card:block hidden">
              {isListener
                ? "Your conversations and messages over time"
                : "Conversations and listener activity across the platform"
              }
            </span>
            <span className="@[540px]/card:hidden">
              {isListener ? "Your activity" : "Platform activity"}
            </span>
          </CardDescription>
          <div className="absolute right-4 top-4">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="@[767px]/card:flex hidden"
            >
              <ToggleGroupItem value="90d" className="h-8 px-2.5">
                Last 3 months
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="h-8 px-2.5">
                Last 30 days
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="h-8 px-2.5">
                Last 7 days
              </ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="@[767px]/card:hidden flex w-40"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={analyticsData.chartData}>
              <defs>
                <linearGradient id="fillConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-conversations)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-conversations)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-messages)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-messages)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="conversations"
                type="natural"
                fill="url(#fillConversations)"
                stroke="var(--color-conversations)"
                stackId="a"
              />
              <Area
                dataKey="messages"
                type="natural"
                fill="url(#fillMessages)"
                stroke="var(--color-messages)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Rated Listeners (for speakers) */}
      {!isListener && analyticsData.summary.topRatedListeners && analyticsData.summary.topRatedListeners.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="h-5 w-5 text-yellow-400" />
              Top Rated Listeners
            </CardTitle>
            <CardDescription>
              Listeners with the highest ratings on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.summary.topRatedListeners.map((listener, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                      #{index + 1}
                    </Badge>
                    <span className="text-white font-medium">{listener.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">{listener.rating}</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      ({listener.totalRatings} reviews)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

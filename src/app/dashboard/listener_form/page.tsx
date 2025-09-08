"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Trash2, 
  Clock, 
  Tag, 
  Star, 
  Users, 
  TrendingUp,
  Save,
  RefreshCw,
  Edit3
} from "lucide-react"

interface Topic {
  id?: string
  name: string
}

interface Availability {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface ListenerProfile {
  id: string
  topics: Topic[]
  availability: Availability[]
  reputation: {
    avgRating: number
    totalRatings: number
    trustMeter: number
    badges: string[]
  } | null
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function ListenerProfilePage() {
  const { data: session, isPending } = authClient.useSession()
  const [profile, setProfile] = useState<ListenerProfile | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Load existing profile data
  useEffect(() => {
    if (session?.user?.id) {
      loadProfile()
    }
  }, [session?.user?.id])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/listener/profile")
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setTopics(data.topics.length > 0 ? data.topics : [{ name: "" }])
        setAvailability(data.availability.length > 0 ? data.availability : [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }
        ])
      } else if (response.status === 404) {
        // New listener - set defaults
        setTopics([{ name: "" }])
        setAvailability([{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }])
        setIsEditing(true)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const validTopics = topics.filter(t => t.name.trim())
    const validAvailability = availability.filter(a => {
      if (!a.startTime || !a.endTime) return false
      const [sh, sm] = a.startTime.split(":").map(Number)
      const [eh, em] = a.endTime.split(":").map(Number)
      return sh * 60 + sm < eh * 60 + em
    })

    if (validTopics.length === 0) {
      toast.error("Please add at least one topic")
      return
    }

    if (validAvailability.length === 0) {
      toast.error("Please add at least one availability slot")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/listener/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: validTopics,
          availability: validAvailability
        })
      })

      if (response.ok) {
        toast.success("Profile updated successfully!")
        setIsEditing(false)
        loadProfile() // Reload to get updated data
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const addTopic = () => {
    setTopics([...topics, { name: "" }])
  }

  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index))
    }
  }

  const updateTopic = (index: number, name: string) => {
    const newTopics = [...topics]
    newTopics[index].name = name
    setTopics(newTopics)
  }

  const addAvailability = () => {
    setAvailability([...availability, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }])
  }

  const removeAvailability = (index: number) => {
    if (availability.length > 1) {
      setAvailability(availability.filter((_, i) => i !== index))
    }
  }

  const updateAvailability = (index: number, field: keyof Availability, value: any) => {
    const newAvailability = [...availability]
    newAvailability[index] = { ...newAvailability[index], [field]: value }
    setAvailability(newAvailability)
  }

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Listener Profile</h1>
          <p className="text-gray-400 mt-1">Manage your topics and availability</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  loadProfile() // Reset changes
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {profile?.reputation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.reputation.avgRating.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Ratings</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.reputation.totalRatings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Trust Score</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(profile.reputation.trustMeter)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Badges</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.reputation.badges.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Topics Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Tag className="h-5 w-5" />
              Topics of Expertise
            </CardTitle>
            {isEditing && (
              <Button onClick={addTopic} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <>
              {topics.map((topic, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={topic.name}
                    onChange={(e) => updateTopic(index, e.target.value)}
                    placeholder="Enter topic (e.g., Mental Health, Career Advice)"
                    className="flex-1"
                  />
                  {topics.length > 1 && (
                    <Button
                      onClick={() => removeTopic(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.filter(t => t.name.trim()).map((topic, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-600 text-white">
                  {topic.name}
                </Badge>
              ))}
              {topics.filter(t => t.name.trim()).length === 0 && (
                <p className="text-gray-400 italic">No topics added yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              Availability Schedule
            </CardTitle>
            {isEditing && (
              <Button onClick={addAvailability} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <>
              {availability.map((slot, index) => (
                <div key={index} className="flex gap-2 items-center p-3 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm text-gray-300">Day</Label>
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => updateAvailability(index, 'dayOfWeek', parseInt(e.target.value))}
                      className="w-full mt-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    >
                      {DAYS.map((day, dayIndex) => (
                        <option key={dayIndex} value={dayIndex}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-sm text-gray-300">Start Time</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailability(index, 'startTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-sm text-gray-300">End Time</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateAvailability(index, 'endTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  {availability.length > 1 && (
                    <Button
                      onClick={() => removeAvailability(index)}
                      size="sm"
                      variant="destructive"
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-2">
              {availability.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-gray-500 text-gray-300">
                      {DAY_ABBR[slot.dayOfWeek]}
                    </Badge>
                    <span className="text-white">
                      {DAYS[slot.dayOfWeek]}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              ))}
              {availability.length === 0 && (
                <p className="text-gray-400 italic">No availability slots added yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

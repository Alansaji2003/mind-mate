import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
console.log("API route /api/user/set-role loaded")

export async function POST(req: Request) {
  console.log("[set-role] POST request received") // entry log

  try {
    const body = await req.json()
    console.log("[set-role] Request body:", body)

    const { userId, role } = body

    if (!userId || !role) {
      console.warn("[set-role] Missing userId or role")
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 })
    }

    if (!["SPEAKER", "LISTENER"].includes(role)) {
      console.warn("[set-role] Invalid role:", role)
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    console.log("[set-role] Checking existing profile for userId:", userId)
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    })
    console.log("[set-role] Existing profile:", existingProfile)

    // If user already has the same role, return success (idempotent)
    if (existingProfile && existingProfile.role === role) {
      console.log("[set-role] Role already set to", role, "for userId:", userId, "- returning existing profile")
      return NextResponse.json(existingProfile)
    }

    // If user has a different role, prevent changing it
    if (existingProfile && existingProfile.role && existingProfile.role !== role) {
      console.warn("[set-role] Attempting to change role from", existingProfile.role, "to", role, "for userId:", userId)
      return NextResponse.json(
        { error: `Role already set to ${existingProfile.role}. Cannot change it.` },
        { status: 403 }
      )
    }

    console.log("[set-role] Creating/updating profile")
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { role },
      create: { userId, role },
    })
    console.log("[set-role] Profile upserted successfully:", profile)

    return NextResponse.json(profile)
  } catch (err) {
    console.error("[set-role] Error setting role:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

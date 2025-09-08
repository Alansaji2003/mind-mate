import { NextRequest, NextResponse } from "next/server"

// Redirect to the main conversations endpoint
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/conversations', req.url))
}

export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/conversations', req.url), 307) // 307 preserves POST method
}
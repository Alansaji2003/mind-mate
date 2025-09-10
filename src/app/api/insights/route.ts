import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const HF_TOKEN = env.HF_API_KEY;
const MODEL_ID = env.MODEL_URL;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, conversationId } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const conversationText = messages
      .filter((msg: any) => msg.senderId !== "SYSTEM")
      .map((msg: any) => `${msg.senderId === session.user.id ? "You" : "Speaker"}: ${msg.content}`)
      .join("\n");

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
       messages: [
    {
      role: "system",
      content:
        "You are a compassionate therapist. Do NOT include reflections, step-by-step analysis, or advice to anyone else. Only give 2 concise paragraphs of practical advice directly to the speaker, based solely on the problems they shared."
    },
    {
      role: "user",
      content: `Based on this conversation, provide practical advice to the speaker. Focus only on what the speaker themselves can do to cope or improve their situation:\n\n${conversationText}`
    }
  ]
,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: "Failed to generate insights",
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    const rawContent = result.choices?.[0]?.message?.content ?? "";

    // Return the raw output without any modification
    return NextResponse.json({ insights: rawContent, conversationId });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

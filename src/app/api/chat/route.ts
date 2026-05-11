import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendMessage } from "@/services/conversation.service"
import { getUserBySupabaseId } from "@/services/progress.service"
import type { SendMessageRequest } from "@/types/api"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body: SendMessageRequest = await request.json()
    const { subject, content, conversationId } = body

    if (!subject || !content?.trim()) {
      return NextResponse.json(
        { error: "subject and content are required" },
        { status: 400 }
      )
    }

    const weakTopics = dbUser.progress
      .find((p: { subject: string; weakTopics: string[] }) => p.subject === subject)
      ?.weakTopics ?? []

    const result = await sendMessage(
      dbUser.id,
      subject,
      content.trim(),
      conversationId,
      dbUser.grade ?? undefined,
      weakTopics
    )

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error("[POST /api/chat]", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}

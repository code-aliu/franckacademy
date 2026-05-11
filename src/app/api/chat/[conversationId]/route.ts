import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConversationById } from "@/services/conversation.service"
import { getUserBySupabaseId } from "@/services/progress.service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
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

    const { conversationId } = await params
    const conversation = await getConversationById(conversationId, dbUser.id)

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ data: conversation, error: null })
  } catch (error) {
    console.error("[GET /api/chat/:id]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

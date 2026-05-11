import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId } from "@/services/progress.service"
import { getConversations } from "@/services/conversation.service"
import type { Subject } from "@/types/database"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject") as Subject | null

    const conversations = await getConversations(dbUser.id, subject ?? undefined)
    return NextResponse.json({ data: conversations, error: null })
  } catch (error) {
    console.error("[GET /api/user/conversations]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

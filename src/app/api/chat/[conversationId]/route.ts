import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConversationById } from "@/services/conversation.service"
import { getUserBySupabaseId } from "@/services/progress.service"
import { prisma } from "@/lib/prisma"

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { conversationId } = await params

    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: dbUser.id },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.conversation.delete({ where: { id: conversationId } })
    return NextResponse.json({ data: null, error: null })
  } catch (error) {
    console.error("[DELETE /api/chat/:id]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { conversationId } = await params
    const { title } = await request.json()

    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 })

    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: dbUser.id },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() },
    })
    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    console.error("[PATCH /api/chat/:id]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

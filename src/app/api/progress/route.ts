import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId, getProgressOverview } from "@/services/progress.service"

export async function GET() {
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

    const overview = await getProgressOverview(dbUser.id)
    return NextResponse.json({ data: overview, error: null })
  } catch (error) {
    console.error("[GET /api/progress]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

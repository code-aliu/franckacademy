import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createUserWithProfile, getUserBySupabaseId } from "@/services/progress.service"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user exists in our DB
      const existingUser = await getUserBySupabaseId(data.user.id)
      if (!existingUser) {
        await createUserWithProfile({
          supabaseId: data.user.id,
          email: data.user.email!,
          fullName:
            data.user.user_metadata?.full_name ??
            data.user.email?.split("@")[0] ??
            "Student",
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

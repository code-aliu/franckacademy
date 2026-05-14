import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId, createUserWithProfile, updateStreakIfNeeded } from "@/services/progress.service"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let dbUser = await getUserBySupabaseId(user.id)

  // Auto-create user record if signup callback didn't run
  if (!dbUser) {
    dbUser = await createUserWithProfile({
      supabaseId: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Student",
      grade: user.user_metadata?.grade,
    })
  }

  // Fire-and-forget streak update (don't block render)
  updateStreakIfNeeded(dbUser.id).catch(() => {})

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          user={{
            fullName: dbUser.fullName,
            email: dbUser.email,
            avatarUrl: dbUser.avatarUrl,
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}

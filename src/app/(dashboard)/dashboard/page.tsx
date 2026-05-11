import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId, getProgressOverview } from "@/services/progress.service"
import { getConversations } from "@/services/conversation.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  BookOpen,
  Flame,
  TrendingUp,
  ArrowRight,
  Plus,
  Calculator,
  Zap,
  FlaskConical,
} from "lucide-react"
import { formatRelativeTime, getSubjectColor, getSubjectLabel } from "@/lib/utils"
import type { Subject } from "@/types/database"

const subjectIcons: Record<Subject, React.ElementType> = {
  MATHEMATICS: Calculator,
  PHYSICS: Zap,
  CHEMISTRY: FlaskConical,
  ENGLISH: BookOpen,
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) redirect("/login")

  const [overview, recentConversations] = await Promise.all([
    getProgressOverview(dbUser.id),
    getConversations(dbUser.id),
  ])

  const stats = [
    {
      label: "Sessions",
      value: overview.totalSessions,
      icon: MessageSquare,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Questions Asked",
      value: overview.totalQuestions,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Day Streak",
      value: overview.streakDays,
      icon: Flame,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good to see you, {dbUser.fullName.split(" ")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dbUser.grade ? `${dbUser.grade} · ` : ""}What are we learning today?
          </p>
        </div>
        <Button asChild className="mt-3 gap-2 sm:mt-0" size="sm">
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            Ask a question
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Subject Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subject Progress</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/progress" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.subjectProgress.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start asking questions to track your progress
              </div>
            ) : (
              overview.subjectProgress.map((sp) => {
                const Icon = subjectIcons[sp.subject] ?? BookOpen
                const pct = Math.min(Math.round((sp.questionsAsked / 50) * 100), 100)
                return (
                  <div key={sp.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {getSubjectLabel(sp.subject)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {sp.questionsAsked} questions
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )
              })
            )}

            {/* Quick-start subjects not yet started */}
            {overview.subjectProgress.length === 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(["MATHEMATICS", "PHYSICS", "CHEMISTRY", "ENGLISH"] as Subject[]).map((s) => (
                  <Button key={s} variant="outline" size="sm" asChild className="justify-start gap-2 text-xs">
                    <Link href={`/chat?subject=${s}`}>
                      {getSubjectLabel(s)}
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Sessions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/chat" className="gap-1 text-xs">
                  New chat <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium">No sessions yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ask your first question to get started
                  </p>
                </div>
                <Button size="sm" asChild className="gap-1.5 mt-1">
                  <Link href="/chat">
                    <Plus className="h-3.5 w-3.5" />
                    Start learning
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConversations.slice(0, 5).map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title ?? "Untitled session"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getSubjectColor(conv.subject)}`}
                        >
                          {getSubjectLabel(conv.subject)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

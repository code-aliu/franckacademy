import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId, getProgressOverview } from "@/services/progress.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Flame,
  MessageSquare,
  TrendingUp,
  BookOpen,
  Calculator,
  Zap,
  FlaskConical,
  Plus,
  Target,
} from "lucide-react"
import { getSubjectLabel, formatRelativeTime } from "@/lib/utils"
import type { Subject } from "@/types/database"

const subjectIcons: Record<Subject, React.ElementType> = {
  MATHEMATICS: Calculator,
  PHYSICS: Zap,
  CHEMISTRY: FlaskConical,
  ENGLISH: BookOpen,
}

const subjectColors: Record<Subject, string> = {
  MATHEMATICS: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  PHYSICS: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  CHEMISTRY: "text-green-600 bg-green-50 dark:bg-green-900/20",
  ENGLISH: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
}

const progressColors: Record<Subject, string> = {
  MATHEMATICS: "[&>div]:bg-blue-500",
  PHYSICS: "[&>div]:bg-purple-500",
  CHEMISTRY: "[&>div]:bg-green-500",
  ENGLISH: "[&>div]:bg-orange-500",
}

const ALL_SUBJECTS: Subject[] = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "ENGLISH"]

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) redirect("/login")

  const overview = await getProgressOverview(dbUser.id)

  const totalQuestionsAllSubjects = overview.subjectProgress.reduce(
    (sum, sp) => sum + sp.questionsAsked,
    0
  )

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your learning journey across subjects
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            New session
          </Link>
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Sessions", value: overview.totalSessions, icon: MessageSquare, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
          { label: "Questions Asked", value: totalQuestionsAllSubjects, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
          { label: "Day Streak", value: overview.streakDays, icon: Flame, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
          { label: "Subjects Active", value: overview.subjectProgress.length, icon: Target, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ALL_SUBJECTS.map((subject) => {
          const sp = overview.subjectProgress.find((p) => p.subject === subject)
          const Icon = subjectIcons[subject]
          const colorClass = subjectColors[subject]
          const progressColor = progressColors[subject]
          const questionsAsked = sp?.questionsAsked ?? 0
          const progressPct = Math.min(Math.round((questionsAsked / 50) * 100), 100)
          const hasActivity = questionsAsked > 0

          return (
            <Card key={subject} className={`shadow-sm transition-opacity ${!hasActivity ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{getSubjectLabel(subject)}</CardTitle>
                  </div>
                  {hasActivity ? (
                    <Badge variant="secondary" className="text-xs">
                      {questionsAsked} questions
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Not started
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className={`h-2 ${progressColor}`} />
                </div>

                {sp && sp.topicsEncountered.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Topics covered
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sp.topicsEncountered.slice(0, 5).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {topic}
                        </Badge>
                      ))}
                      {sp.topicsEncountered.length > 5 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          +{sp.topicsEncountered.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {sp?.weakTopics && sp.weakTopics.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      Areas to improve
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sp.weakTopics.map((topic) => (
                        <Badge key={topic} variant="destructive" className="text-[10px] px-1.5 py-0 capitalize opacity-80">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" size="sm" asChild className="w-full text-xs mt-1">
                  <Link href={`/chat?subject=${subject}`}>
                    {hasActivity ? "Continue studying" : "Start studying"}
                  </Link>
                </Button>

                {sp?.lastStudiedAt && (
                  <p className="text-center text-[10px] text-muted-foreground">
                    Last studied {formatRelativeTime(sp.lastStudiedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent activity */}
      {overview.recentConversations.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your last sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.recentConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${subjectColors[conv.subject]}`}>
                    {(() => { const I = subjectIcons[conv.subject]; return <I className="h-4 w-4" /> })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title ?? "Untitled session"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSubjectLabel(conv.subject)} · {formatRelativeTime(conv.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

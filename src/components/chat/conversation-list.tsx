"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Plus,
  Calculator,
  Zap,
  FlaskConical,
  BookOpen,
  Search,
  X,
} from "lucide-react"
import { cn, formatRelativeTime, getSubjectLabel } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Conversation, Subject } from "@/types/database"
import { useState, useMemo } from "react"

const subjectIcons: Record<Subject, React.ElementType> = {
  MATHEMATICS: Calculator,
  PHYSICS: Zap,
  CHEMISTRY: FlaskConical,
  ENGLISH: BookOpen,
}

const subjectColors: Record<Subject, string> = {
  MATHEMATICS: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  PHYSICS: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
  CHEMISTRY: "text-green-500 bg-green-50 dark:bg-green-900/20",
  ENGLISH: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
}

const ALL_SUBJECTS: Subject[] = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "ENGLISH"]

interface ConversationListProps {
  conversations: Conversation[]
  isLoading: boolean
  activeId?: string
  onClose?: () => void
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onClose,
}: ConversationListProps) {
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState<Subject | null>(null)

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        getSubjectLabel(c.subject).toLowerCase().includes(search.toLowerCase())
      const matchesSubject = !subjectFilter || c.subject === subjectFilter
      return matchesSearch && matchesSubject
    })
  }, [conversations, search, subjectFilter])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="text-sm font-semibold text-foreground">History</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href="/chat">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Subject filter pills */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
        <button
          onClick={() => setSubjectFilter(null)}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            !subjectFilter
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>
        {ALL_SUBJECTS.map((s) => {
          const Icon = subjectIcons[s]
          return (
            <button
              key={s}
              onClick={() => setSubjectFilter(subjectFilter === s ? null : s)}
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                subjectFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="h-3 w-3" />
              {getSubjectLabel(s).slice(0, 4)}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {isLoading ? (
          <div className="space-y-1 px-1 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {search || subjectFilter ? "No matching sessions" : "No sessions yet"}
            </p>
            {!search && !subjectFilter && (
              <Button size="sm" variant="outline" asChild className="text-xs h-7 mt-1">
                <Link href="/chat">Start your first session</Link>
              </Button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const Icon = subjectIcons[conv.subject]
            const colorClass = subjectColors[conv.subject]
            const isActive =
              activeId === conv.id || pathname === `/chat/${conv.id}`

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                onClick={onClose}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors group",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted/60 text-foreground"
                )}
              >
                <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium leading-tight">
                    {conv.title ?? `${getSubjectLabel(conv.subject)} session`}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

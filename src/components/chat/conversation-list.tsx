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
  Trash2,
  Pencil,
  Check,
} from "lucide-react"
import { cn, formatRelativeTime, getSubjectLabel } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Conversation, Subject } from "@/types/database"
import { useState, useMemo, useRef, useEffect } from "react"

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
  onDelete?: (id: string) => void
  onRename?: (id: string, title: string) => void
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onClose,
  onDelete,
  onRename,
}: ConversationListProps) {
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState<Subject | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function startEdit(conv: Conversation) {
    setEditingId(conv.id)
    setEditValue(conv.title ?? getSubjectLabel(conv.subject) + " session")
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim()
    if (trimmed && onRename) onRename(id, trimmed)
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

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
            const isActive = activeId === conv.id || pathname === `/chat/${conv.id}`
            const isEditing = editingId === conv.id

            return (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-muted/60"
                )}
              >
                <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {isEditing ? (
                  <div className="flex flex-1 items-center gap-1 min-w-0">
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(conv.id)
                        if (e.key === "Escape") cancelEdit()
                      }}
                      className="flex-1 min-w-0 rounded border border-ring bg-background px-1.5 py-0.5 text-xs text-foreground outline-none"
                    />
                    <button onClick={() => commitEdit(conv.id)} className="shrink-0 text-primary hover:text-primary/80">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={cancelEdit} className="shrink-0 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      href={`/chat/${conv.id}`}
                      onClick={onClose}
                      className="flex-1 min-w-0"
                    >
                      <p className="truncate text-xs font-medium leading-tight text-foreground">
                        {conv.title ?? `${getSubjectLabel(conv.subject)} session`}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatRelativeTime(conv.updatedAt)}
                      </p>
                    </Link>

                    {/* Hover actions */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-background/90 rounded-md border px-0.5 py-0.5 shadow-sm">
                      {onRename && (
                        <button
                          onClick={() => startEdit(conv)}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(conv.id)}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

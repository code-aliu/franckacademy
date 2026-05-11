"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, User } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import type { Message } from "@/types/database"
import "katex/dist/katex.min.css"

interface MessageBubbleProps {
  message: Message
  studentName?: string
  studentAvatar?: string
}

export function MessageBubble({ message, studentName, studentAvatar }: MessageBubbleProps) {
  const isUser = message.role === "USER"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        {isUser ? (
          <>
            <AvatarImage src={studentAvatar} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {studentName ? studentName[0].toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1 max-w-[85%] md:max-w-[75%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm shadow-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

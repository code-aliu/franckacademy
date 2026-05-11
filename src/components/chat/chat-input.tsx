"use client"

import { useRef, useState } from "react"
import { Send, Paperclip, X, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string) => void
  onImageAttach?: () => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  onImageAttach,
  onStop,
  isLoading,
  disabled,
  placeholder = "Ask your question...",
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className={cn(
          "flex items-end gap-2 rounded-xl border bg-card shadow-sm p-2 transition-shadow",
          "focus-within:shadow-md focus-within:border-primary/50"
        )}>
          {onImageAttach && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onImageAttach}
              disabled={disabled || isLoading}
              title="Upload homework image"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent min-h-[36px] max-h-40 py-2 px-1"
          />

          {isLoading && onStop ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 h-8 w-8 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={onStop}
              title="Stop generation"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </Button>
          ) : (
          <Button
            type="button"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={handleSend}
            disabled={!value.trim() || isLoading || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
          )}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

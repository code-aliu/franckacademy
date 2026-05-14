"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle, ArrowLeft, PanelLeftOpen, PanelLeftClose, X, History,
} from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useConversations } from "@/hooks/use-conversations"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ConversationList } from "@/components/chat/conversation-list"
import { ImageUpload } from "@/components/upload/image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"
import { ChatSkeleton } from "@/components/shared/loading-skeleton"
import { getSubjectLabel, getSubjectColor, cn } from "@/lib/utils"
import type { Subject } from "@/types/database"

export default function ConversationPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()

  const [subject, setSubject] = useState<Subject>("MATHEMATICS")
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, isLoading: convsLoading, updateTitle } = useConversations()

  const { messages, isLoading, error, sendMessage, loadConversation, stopGeneration } = useChat({
    conversationId: sessionId,
    subject,
    onTitleUpdate: updateTitle,
  })

  useEffect(() => {
    loadConversation(sessionId).then(() => setInitialLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Detect subject from loaded messages' conversation context
  useEffect(() => {
    const conv = conversations.find((c) => c.id === sessionId)
    if (conv) setSubject(conv.subject)
  }, [conversations, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  async function handleImageUpload(imageUrl: string) {
    setShowUpload(false)
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })
      const json = await res.json()
      if (json.data?.cleanedText) {
        await sendMessage(json.data.cleanedText)
      }
    } catch {
      setUploadError("Failed to process image")
    }
  }

  if (initialLoading) return <ChatSkeleton />

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile history drawer */}
      <Sheet open={mobileHistoryOpen} onClose={() => setMobileHistoryOpen(false)}>
        <ConversationList
          conversations={conversations}
          isLoading={convsLoading}
          activeId={sessionId}
          onClose={() => setMobileHistoryOpen(false)}
        />
      </Sheet>

      {/* Desktop conversation sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-shrink-0 border-r bg-sidebar transition-all duration-200",
          sidebarOpen ? "md:w-64" : "md:w-0 overflow-hidden border-0"
        )}
      >
        {sidebarOpen && (
          <ConversationList
            conversations={conversations}
            isLoading={convsLoading}
            activeId={sessionId}
          />
        )}
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 text-muted-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen
                ? <PanelLeftClose className="h-4 w-4" />
                : <PanelLeftOpen className="h-4 w-4" />
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileHistoryOpen(true)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => router.push("/chat")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge className={`${getSubjectColor(subject)} border-0 text-xs`}>
              {getSubjectLabel(subject)}
            </Badge>
            <span className="hidden sm:block text-sm font-medium truncate max-w-[200px] text-foreground">
              {conversations.find((c) => c.id === sessionId)?.title ?? "Session"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1.5"
            asChild
          >
            <a href="/chat">New chat</a>
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "ASSISTANT" && (
            <TypingIndicator />
          )}

          {error && (
            <div className="mx-4 my-2 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upload panel */}
        {showUpload && (
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">Add homework image</p>
                <button onClick={() => setShowUpload(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {uploadError && <p className="mb-2 text-xs text-destructive">{uploadError}</p>}
              <ImageUpload onUploadComplete={handleImageUpload} onError={setUploadError} />
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          onImageAttach={() => setShowUpload(!showUpload)}
          isLoading={isLoading}
          placeholder="Continue the conversation..."
        />
      </div>
    </div>
  )
}

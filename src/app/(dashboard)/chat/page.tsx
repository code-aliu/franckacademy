"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  MessageSquare, Camera, X, AlertCircle, Loader2,
  PanelLeftOpen, PanelLeftClose,
} from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useOCR } from "@/hooks/use-ocr"
import { useConversations } from "@/hooks/use-conversations"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { SubjectSelector } from "@/components/chat/subject-selector"
import { ConversationList } from "@/components/chat/conversation-list"
import { ImageUpload } from "@/components/upload/image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSubjectLabel, getSubjectColor, cn } from "@/lib/utils"
import type { Subject } from "@/types/database"

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSubject = searchParams.get("subject") as Subject | null

  const [subject, setSubject] = useState<Subject | null>(urlSubject)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, isLoading: convsLoading, prependConversation } =
    useConversations({ subject: subject ?? undefined })

  const { messages, isLoading, error, sendMessage, activeConversationId, stopGeneration } =
    useChat({
      subject: subject ?? "MATHEMATICS",
      onNewConversation: (id) => {
        router.replace(`/chat/${id}`, { scroll: false })
        if (subject) {
          prependConversation({ id, subject })
        }
      },
    })

  const { isProcessing, processImage } = useOCR()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  async function handleImageUpload(imageUrl: string) {
    if (!subject) return
    setShowUpload(false)
    const convId = await processImage(imageUrl, subject)
    if (convId) router.push(`/chat/${convId}`)
  }

  if (!subject) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-primary/60" />
          <h1 className="text-2xl font-bold">What are you studying?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a subject to get started</p>
        </div>
        <div className="w-full max-w-md">
          <SubjectSelector value={null} onChange={setSubject} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar — desktop always visible, mobile overlay */}
      <div
        className={cn(
          "flex-shrink-0 border-r bg-sidebar transition-all duration-200",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-0"
        )}
      >
        {sidebarOpen && (
          <ConversationList
            conversations={conversations}
            isLoading={convsLoading}
            activeId={activeConversationId}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Hide history" : "Show history"}
            >
              {sidebarOpen
                ? <PanelLeftClose className="h-4 w-4" />
                : <PanelLeftOpen className="h-4 w-4" />
              }
            </Button>
            <Badge className={`${getSubjectColor(subject)} border-0 text-xs`}>
              {getSubjectLabel(subject)}
            </Badge>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              New session
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1.5 h-7"
            onClick={() => setSubject(null)}
          >
            Change subject
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="max-w-sm">
                <h3 className="font-semibold">Ready to help with {getSubjectLabel(subject)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Type your question below, or upload a photo of your homework.
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Upload homework photo
              </button>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "ASSISTANT" && (
            <TypingIndicator />
          )}

          {isProcessing && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading your homework image...
            </div>
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
                <p className="text-sm font-medium">Upload homework image</p>
                <button onClick={() => { setShowUpload(false); setUploadError(null) }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {uploadError && <p className="mb-2 text-xs text-destructive">{uploadError}</p>}
              <ImageUpload
                onUploadComplete={handleImageUpload}
                onError={setUploadError}
                subject={subject}
              />
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          onImageAttach={() => { setShowUpload(!showUpload); setUploadError(null) }}
          isLoading={isLoading || isProcessing}
          placeholder={`Ask your ${getSubjectLabel(subject)} question...`}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}

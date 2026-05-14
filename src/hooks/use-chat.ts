"use client"

import { useState, useCallback, useRef } from "react"
import type { Message, Subject } from "@/types/database"
import { toast } from "./use-toast"

interface UseChatOptions {
  conversationId?: string
  subject: Subject
  onNewConversation?: (id: string) => void
  onTitleUpdate?: (id: string, title: string) => void
}

const STREAMING_MSG_PREFIX = "streaming-"

export function useChat({ conversationId, subject, onNewConversation, onTitleUpdate }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    conversationId
  )
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null)
      setIsLoading(true)

      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      // Optimistic user message (temp ID replaced on init event)
      const tempUserId = `${STREAMING_MSG_PREFIX}user-${Date.now()}`
      const tempAssistantId = `${STREAMING_MSG_PREFIX}ai-${Date.now()}`

      const optimisticUser: Message = {
        id: tempUserId,
        conversationId: activeConversationId ?? "",
        role: "USER",
        content,
        metadata: null,
        createdAt: new Date(),
      }

      // Add user message + empty streaming assistant placeholder
      const streamingAssistant: Message = {
        id: tempAssistantId,
        conversationId: activeConversationId ?? "",
        role: "ASSISTANT",
        content: "",
        metadata: null,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, optimisticUser, streamingAssistant])

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            content,
            conversationId: activeConversationId,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to start conversation")
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE events from buffer
          const parts = buffer.split("\n\n")
          buffer = parts.pop() ?? "" // Keep incomplete last part

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue
            try {
              const event = JSON.parse(part.slice(6))
              handleStreamEvent(event, tempUserId, tempAssistantId)
            } catch {
              // Malformed event — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
        toast({ title: "Error", description: message, variant: "destructive" })
        // Remove optimistic messages on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId)
        )
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeConversationId, subject]
  )

  function handleStreamEvent(
    event: {
      type: string
      conversationId?: string
      userMessageId?: string
      content?: string
      assistantMessageId?: string
      topics?: string[]
      conversationTitle?: string
      message?: string
    },
    tempUserId: string,
    tempAssistantId: string
  ) {
    switch (event.type) {
      case "init":
        // Replace temp conversation IDs and user message ID
        if (event.conversationId) {
          const newConvId = event.conversationId
          if (!activeConversationId) {
            setActiveConversationId(newConvId)
            onNewConversation?.(newConvId)
          }
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === tempUserId) {
                return { ...m, id: event.userMessageId ?? m.id, conversationId: newConvId }
              }
              if (m.id === tempAssistantId) {
                return { ...m, conversationId: newConvId }
              }
              return m
            })
          )
        }
        break

      case "token":
        // Append token to streaming assistant message
        if (event.content) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? { ...m, content: m.content + event.content }
                : m
            )
          )
        }
        break

      case "done":
        if (event.assistantMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId ? { ...m, id: event.assistantMessageId! } : m
            )
          )
        }
        if (event.conversationTitle && event.conversationId) {
          onTitleUpdate?.(event.conversationId, event.conversationTitle)
        }
        break

      case "error":
        setError(event.message ?? "An error occurred")
        toast({ title: "Error", description: event.message, variant: "destructive" })
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId)
        )
        break
    }
  }

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/chat/${id}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to load")
      setMessages(json.data.messages)
      setActiveConversationId(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load conversation"
      setError(message)
      toast({ title: "Error loading conversation", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    activeConversationId,
    sendMessage,
    loadConversation,
    stopGeneration,
    setMessages,
  }
}

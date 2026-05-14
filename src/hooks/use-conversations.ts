"use client"

import { useState, useEffect, useCallback } from "react"
import type { Conversation, Subject } from "@/types/database"

interface UseConversationsOptions {
  subject?: Subject
}

export function useConversations({ subject }: UseConversationsOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `/api/user/conversations${subject ? `?subject=${subject}` : ""}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to fetch")
      setConversations(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }, [subject])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  // Prepend a new conversation to the local list (optimistic)
  const prependConversation = useCallback((conv: Partial<Conversation> & { id: string; subject: Subject }) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id)
      if (exists) return prev
      return [
        {
          title: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
          messages: [],
          ...conv,
        } as Conversation,
        ...prev,
      ]
    })
  }, [])

  const updateTitle = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
    } catch {
      await fetch_() // re-sync on failure
    }
  }, [fetch_])

  const renameConversation = useCallback(async (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
    try {
      await fetch(`/api/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
    } catch {
      await fetch_()
    }
  }, [fetch_])

  return {
    conversations,
    isLoading,
    error,
    refresh: fetch_,
    prependConversation,
    updateTitle,
    deleteConversation,
    renameConversation,
  }
}

"use client"

import { useState, useCallback } from "react"

type ToastVariant = "default" | "destructive" | "success"

interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

// Simple module-level store (no context needed for this scale)
type Listener = (toasts: ToastData[]) => void
let toasts: ToastData[] = []
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(data: Omit<ToastData, "id">) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, duration: 4000, ...data }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, data.duration ?? 4000)
}

export function useToastStore() {
  const [localToasts, setLocalToasts] = useState<ToastData[]>([])

  const subscribe = useCallback((): (() => void) => {
    const listener: Listener = (t) => setLocalToasts(t)
    listeners.add(listener)
    setLocalToasts([...toasts])
    return () => { listeners.delete(listener) }
  }, [])

  return { localToasts, subscribe }
}

export type { ToastData }

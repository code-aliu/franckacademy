"use client"

import { useEffect } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToastStore } from "@/hooks/use-toast"

export function Toaster() {
  const { localToasts, subscribe } = useToastStore()

  useEffect(() => {
    const unsubscribe = subscribe()
    return unsubscribe
  }, [subscribe])

  return (
    <ToastProvider>
      {localToasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

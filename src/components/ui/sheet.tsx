"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
}

export function Sheet({ open, onClose, children, side = "left", className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 z-50 h-full w-72 bg-sidebar shadow-xl transition-transform duration-200 ease-in-out",
          side === "left" ? "left-0" : "right-0",
          side === "left"
            ? open ? "translate-x-0" : "-translate-x-full"
            : open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  )
}

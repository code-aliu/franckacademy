"use client"

import { useState, useCallback } from "react"
import type { Subject } from "@/types/database"

interface UseOCRResult {
  extractedText: string | null
  confidence: number | null
  conversationId: string | null
  isProcessing: boolean
  error: string | null
  processImage: (imageUrl: string, subject: Subject) => Promise<string | null>
  reset: () => void
}

export function useOCR(): UseOCRResult {
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImage = useCallback(async (imageUrl: string, subject: Subject) => {
    setIsProcessing(true)
    setError(null)
    setExtractedText(null)

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, subject }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to process image")
      }

      const { extractedText: text, ocrConfidence, conversationId: convId } = json.data

      setExtractedText(text)
      setConfidence(ocrConfidence)
      setConversationId(convId)
      return convId
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR processing failed")
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const reset = useCallback(() => {
    setExtractedText(null)
    setConfidence(null)
    setConversationId(null)
    setError(null)
    setIsProcessing(false)
  }, [])

  return { extractedText, confidence, conversationId, isProcessing, error, processImage, reset }
}

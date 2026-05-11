import type { Subject } from "./database"

export interface TutorRequest {
  subject: Subject
  question: string
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
  studentGrade?: string
  previousWeakTopics?: string[]
}

export interface TutorResponse {
  content: string
  detectedTopics: string[]
  hintsProvided: number
  isComplete: boolean
}

export interface OCRExtractionResult {
  rawText: string
  confidence: number
  cleanedText: string
  detectedSubject?: Subject
}

export interface SubjectConfig {
  systemPrompt: string
  responseStyle: string
  mathFormatting: boolean
  exampleStyle: string
}

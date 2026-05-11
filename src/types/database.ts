export type Subject = "MATHEMATICS" | "PHYSICS" | "CHEMISTRY" | "ENGLISH"
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM"
export type SubmissionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export interface User {
  id: string
  supabaseId: string
  email: string
  fullName: string
  avatarUrl: string | null
  grade: string | null
  createdAt: Date
  updatedAt: Date
}

export interface StudentProfile {
  id: string
  userId: string
  weakSubjects: Subject[]
  strongSubjects: Subject[]
  learningStyle: string | null
  totalSessions: number
  totalQuestions: number
  streakDays: number
  lastActiveAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  userId: string
  subject: Subject
  title: string | null
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
  submission?: HomeworkSubmission | null
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata: MessageMetadata | null
  createdAt: Date
}

export interface MessageMetadata {
  hintsShown?: number
  stepsRevealed?: number
  subject?: Subject
  topics?: string[]
}

export interface HomeworkSubmission {
  id: string
  userId: string
  conversationId: string
  subject: Subject
  rawImageUrl: string | null
  extractedText: string | null
  ocrConfidence: number | null
  processedText: string | null
  status: SubmissionStatus
  createdAt: Date
  updatedAt: Date
}

export interface SubjectProgress {
  id: string
  userId: string
  subject: Subject
  questionsAsked: number
  sessionsCount: number
  avgHintsUsed: number
  topicsEncountered: string[]
  weakTopics: string[]
  lastStudiedAt: Date
  updatedAt: Date
}

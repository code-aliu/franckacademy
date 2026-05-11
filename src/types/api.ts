import type { Subject, Message, Conversation, SubjectProgress } from "./database"

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Auth
export interface SignUpRequest {
  email: string
  password: string
  fullName: string
  grade?: string
}

export interface SignInRequest {
  email: string
  password: string
}

// Chat
export interface SendMessageRequest {
  conversationId?: string
  subject: Subject
  content: string
  imageUrl?: string
}

export interface SendMessageResponse {
  conversation: Conversation
  userMessage: Message
  assistantMessage: Message
}

// OCR
export interface OCRRequest {
  imageUrl: string
  subject?: Subject
}

export interface OCRResponse {
  extractedText: string
  confidence: number
  processedText: string
}

// Conversations
export interface CreateConversationRequest {
  subject: Subject
  initialMessage?: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

// Progress
export interface ProgressOverview {
  totalSessions: number
  totalQuestions: number
  streakDays: number
  subjectProgress: SubjectProgress[]
  recentConversations: Conversation[]
}

// Dashboard
export interface DashboardData {
  user: {
    fullName: string
    email: string
    grade: string | null
    avatarUrl: string | null
  }
  stats: {
    totalSessions: number
    totalQuestions: number
    streakDays: number
  }
  recentConversations: Conversation[]
  subjectProgress: SubjectProgress[]
}

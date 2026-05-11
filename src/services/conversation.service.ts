import { prisma } from "@/lib/prisma"
import { generateTutorResponse, generateConversationTitle } from "./ai/tutor.service"
import type { Subject } from "@/types/database"
import type { ConversationWithMessages } from "@/types/api"

export async function getOrCreateConversation(
  userId: string,
  subject: Subject,
  conversationId?: string
) {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    })
    if (existing) return existing
  }

  return prisma.conversation.create({
    data: { userId, subject },
    include: { messages: true },
  })
}

export async function sendMessage(
  userId: string,
  subject: Subject,
  content: string,
  conversationId?: string,
  studentGrade?: string,
  weakTopics?: string[]
) {
  const conversation = await getOrCreateConversation(userId, subject, conversationId)

  // Persist user message
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content,
    },
  })

  // Build history for AI (exclude system messages)
  const history = conversation.messages
    .filter((m: { role: string; content: string }) => m.role !== "SYSTEM")
    .map((m: { role: string; content: string }) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }))

  // Get AI response
  const tutorResponse = await generateTutorResponse({
    subject,
    question: content,
    conversationHistory: history,
    studentGrade,
    previousWeakTopics: weakTopics,
  })

  // Persist assistant message
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: tutorResponse.content,
      metadata: {
        hintsProvided: tutorResponse.hintsProvided,
        detectedTopics: tutorResponse.detectedTopics,
      },
    },
  })

  // Auto-generate title on first message
  if (conversation.messages.length === 0 && !conversation.title) {
    const title = await generateConversationTitle(content, subject)
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title },
    })
  }

  // Update subject progress
  await updateSubjectProgress(userId, subject, tutorResponse.detectedTopics)

  return {
    conversation: { ...conversation, id: conversation.id },
    userMessage,
    assistantMessage,
  }
}

async function updateSubjectProgress(
  userId: string,
  subject: Subject,
  newTopics: string[]
) {
  const existing = await prisma.subjectProgress.findUnique({
    where: { userId_subject: { userId, subject } },
  })

  const mergedTopics = Array.from(
    new Set([...(existing?.topicsEncountered ?? []), ...newTopics])
  )

  await prisma.subjectProgress.upsert({
    where: { userId_subject: { userId, subject } },
    create: {
      userId,
      subject,
      questionsAsked: 1,
      topicsEncountered: mergedTopics,
      weakTopics: [],
      lastStudiedAt: new Date(),
    },
    update: {
      questionsAsked: { increment: 1 },
      topicsEncountered: mergedTopics,
      lastStudiedAt: new Date(),
    },
  })

  // Update student profile totals
  await prisma.studentProfile.updateMany({
    where: { userId },
    data: {
      totalQuestions: { increment: 1 },
      lastActiveAt: new Date(),
    },
  })
}

export async function getConversations(
  userId: string,
  subject?: Subject
): Promise<ConversationWithMessages[]> {
  return prisma.conversation.findMany({
    where: {
      userId,
      ...(subject ? { subject } : {}),
      isArchived: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1, // Just the first message for preview
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  }) as Promise<ConversationWithMessages[]>
}

export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      submission: true,
    },
  }) as Promise<ConversationWithMessages | null>
}

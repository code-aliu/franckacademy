import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai"
import { SUBJECT_PROMPTS } from "@/services/ai/prompts"
import { generateConversationTitle } from "@/services/ai/tutor.service"
import { getUserBySupabaseId } from "@/services/progress.service"
import type { Subject } from "@/types/database"

// SSE event types streamed to the client
type StreamEvent =
  | { type: "init"; conversationId: string; userMessageId: string }
  | { type: "token"; content: string }
  | { type: "done"; conversationId: string; assistantMessageId: string; topics: string[]; conversationTitle?: string }
  | { type: "error"; message: string }

function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const body: {
    subject: Subject
    content: string
    conversationId?: string
  } = await request.json()

  const { subject, content, conversationId } = body

  if (!subject || !content?.trim()) {
    return NextResponse.json({ error: "subject and content are required" }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(encodeEvent(event)))

      try {
        // 1. Get or create conversation
        let conversation
        if (conversationId) {
          conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId: dbUser.id },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          })
        }
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { userId: dbUser.id, subject },
            include: { messages: true },
          })
        }

        // 2. Save user message immediately
        const userMessage = await prisma.message.create({
          data: { conversationId: conversation.id, role: "USER", content: content.trim() },
        })

        // 3. Send init event so client knows the conversation ID
        send({ type: "init", conversationId: conversation.id, userMessageId: userMessage.id })

        // 4. Build prompt history
        const weakTopics =
          dbUser.progress.find((p: { subject: string }) => p.subject === subject)
            ?.weakTopics ?? []

        const systemPrompt = SUBJECT_PROMPTS[subject]
        const historyMessages = conversation.messages
          .filter((m: { role: string }) => m.role !== "SYSTEM")
          .map((m: { role: string; content: string }) => ({
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
          }))

        const openaiMessages: Array<{
          role: "system" | "user" | "assistant"
          content: string
        }> = [
          { role: "system", content: systemPrompt },
          ...(dbUser.grade
            ? [{ role: "system" as const, content: `Student grade: ${dbUser.grade}. Adjust accordingly.` }]
            : []),
          ...(weakTopics.length > 0
            ? [{ role: "system" as const, content: `Previously struggled with: ${weakTopics.join(", ")}.` }]
            : []),
          ...historyMessages,
          { role: "user", content: content.trim() },
        ]

        // 5. Stream from OpenAI
        let fullContent = ""
        const openaiStream = await getOpenAI().chat.completions.create({
          model: OPENAI_MODEL,
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        })

        for await (const chunk of openaiStream) {
          const token = chunk.choices[0]?.delta?.content ?? ""
          if (token) {
            fullContent += token
            send({ type: "token", content: token })
          }
        }

        // 6. Save assistant message
        const detectedTopics = extractTopics(fullContent, subject)
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: fullContent,
            metadata: {
              hintsProvided: countHints(fullContent),
              detectedTopics,
            },
          },
        })

        // 7. Auto-title on first exchange — await so we can send it to the client
        let conversationTitle: string | undefined
        if (conversation.messages.length === 0 && !conversation.title) {
          conversationTitle = await generateConversationTitle(content.trim(), subject)
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { title: conversationTitle },
          })
        }

        // 8. Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        })

        // 9. Update progress (fire-and-forget)
        updateProgress(dbUser.id, subject, detectedTopics)

        send({
          type: "done",
          conversationId: conversation.id,
          assistantMessageId: assistantMessage.id,
          topics: detectedTopics,
          conversationTitle,
        })
        controller.close()
      } catch (err) {
        console.error("[POST /api/chat/stream]", err)
        send({ type: "error", message: "An error occurred. Please try again." })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

// Fire-and-forget progress update
async function updateProgress(userId: string, subject: Subject, newTopics: string[]) {
  try {
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
    await prisma.studentProfile.updateMany({
      where: { userId },
      data: { totalQuestions: { increment: 1 }, lastActiveAt: new Date() },
    })
  } catch (e) {
    console.error("[updateProgress]", e)
  }
}

function extractTopics(content: string, subject: Subject): string[] {
  const patterns: Record<Subject, RegExp[]> = {
    MATHEMATICS: [
      /quadratic/gi, /trigonometry/gi, /calculus/gi, /algebra/gi,
      /geometry/gi, /statistics/gi, /probability/gi, /differentiation/gi,
      /integration/gi, /vectors/gi, /matrices/gi, /logarithm/gi, /polynomial/gi,
    ],
    PHYSICS: [
      /newton/gi, /velocity/gi, /acceleration/gi, /momentum/gi,
      /energy/gi, /waves/gi, /electricity/gi, /magnetism/gi,
      /thermodynamics/gi, /optics/gi, /gravity/gi, /force/gi,
    ],
    CHEMISTRY: [
      /bonding/gi, /stoichiometry/gi, /organic/gi, /acids/gi,
      /reactions/gi, /equilibrium/gi, /electrochemistry/gi, /periodic/gi,
      /oxidation/gi, /reduction/gi, /molar/gi,
    ],
    ENGLISH: [
      /grammar/gi, /essay/gi, /comprehension/gi, /analysis/gi,
      /literature/gi, /writing/gi, /punctuation/gi, /syntax/gi,
      /metaphor/gi, /simile/gi, /narrative/gi,
    ],
  }
  const found = new Set<string>()
  for (const pattern of patterns[subject] ?? []) {
    const match = content.match(pattern)
    if (match) found.add(match[0].toLowerCase())
  }
  return Array.from(found)
}

function countHints(content: string): number {
  return ["hint", "tip", "notice that", "try", "think about", "consider"].filter((h) =>
    content.toLowerCase().includes(h)
  ).length
}

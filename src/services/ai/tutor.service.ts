import { getOpenAI, OPENAI_MODEL } from "@/lib/openai"
import { SUBJECT_PROMPTS, CONVERSATION_TITLE_PROMPT } from "./prompts"
import type { TutorRequest, TutorResponse } from "@/types/ai"
import type { Subject } from "@/types/database"

export async function generateTutorResponse(
  request: TutorRequest
): Promise<TutorResponse> {
  const systemPrompt = SUBJECT_PROMPTS[request.subject]

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ]

  // Inject grade context if available
  if (request.studentGrade) {
    messages.push({
      role: "system",
      content: `The student is in ${request.studentGrade}. Adjust complexity accordingly.`,
    })
  }

  // Inject weak topics context
  if (request.previousWeakTopics && request.previousWeakTopics.length > 0) {
    messages.push({
      role: "system",
      content: `This student has previously struggled with: ${request.previousWeakTopics.join(", ")}. Be extra careful with these areas.`,
    })
  }

  // Add conversation history
  for (const msg of request.conversationHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // Add current question
  messages.push({ role: "user", content: request.question })

  const response = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content ?? ""

  // Extract topics mentioned (simple heuristic — can be improved with structured output)
  const detectedTopics = extractTopics(content, request.subject)

  return {
    content,
    detectedTopics,
    hintsProvided: countHints(content),
    isComplete: true,
  }
}

export async function generateConversationTitle(
  firstMessage: string,
  subject: Subject
): Promise<string> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: CONVERSATION_TITLE_PROMPT },
        {
          role: "user",
          content: `Subject: ${subject}\nStudent message: ${firstMessage}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 20,
    })
    return response.choices[0]?.message?.content?.trim() ?? `${subject} Session`
  } catch {
    return `${subject} Session`
  }
}

function extractTopics(content: string, subject: Subject): string[] {
  const topicPatterns: Record<Subject, RegExp[]> = {
    MATHEMATICS: [
      /quadratic/gi, /trigonometry/gi, /calculus/gi, /algebra/gi,
      /geometry/gi, /statistics/gi, /probability/gi, /differentiation/gi,
      /integration/gi, /vectors/gi, /matrices/gi,
    ],
    PHYSICS: [
      /newton/gi, /velocity/gi, /acceleration/gi, /momentum/gi,
      /energy/gi, /waves/gi, /electricity/gi, /magnetism/gi,
      /thermodynamics/gi, /optics/gi,
    ],
    CHEMISTRY: [
      /bonding/gi, /stoichiometry/gi, /organic/gi, /acids/gi,
      /reactions/gi, /equilibrium/gi, /electrochemistry/gi, /periodic/gi,
    ],
    ENGLISH: [
      /grammar/gi, /essay/gi, /comprehension/gi, /analysis/gi,
      /literature/gi, /writing/gi, /punctuation/gi, /syntax/gi,
    ],
  }

  const patterns = topicPatterns[subject] ?? []
  const found = new Set<string>()

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) found.add(match[0].toLowerCase())
  }

  return Array.from(found)
}

function countHints(content: string): number {
  const hintIndicators = ["hint", "tip", "notice that", "try", "think about", "consider"]
  return hintIndicators.filter((h) =>
    content.toLowerCase().includes(h)
  ).length
}

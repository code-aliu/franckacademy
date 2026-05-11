import { getOpenAI, OPENAI_MODEL } from "@/lib/openai"
import { OCR_EXTRACTION_PROMPT } from "./ai/prompts"
import type { OCRExtractionResult } from "@/types/ai"

export async function extractTextFromImage(
  imageUrl: string
): Promise<OCRExtractionResult> {
  const response = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: OCR_EXTRACTION_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please extract and interpret the text from this homework image.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  })

  const raw = response.choices[0]?.message?.content ?? "{}"

  try {
    const parsed = JSON.parse(raw) as {
      rawText?: string
      cleanedText?: string
      detectedSubject?: string
      confidence?: number
    }

    return {
      rawText: parsed.rawText ?? "",
      cleanedText: parsed.cleanedText ?? parsed.rawText ?? "",
      confidence: parsed.confidence ?? 0.8,
      detectedSubject: parsed.detectedSubject as OCRExtractionResult["detectedSubject"],
    }
  } catch {
    // Fallback: treat the raw content as extracted text
    return {
      rawText: raw,
      cleanedText: raw,
      confidence: 0.5,
    }
  }
}

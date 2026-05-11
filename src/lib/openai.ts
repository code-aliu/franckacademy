import OpenAI from "openai"

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o"

// Lazy singleton — only instantiated when first called (not at module load/build time)
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractTextFromImage } from "@/services/ocr.service"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const result = await extractTextFromImage(imageUrl)
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error("[POST /api/ocr]", error)
    return NextResponse.json({ error: "OCR extraction failed" }, { status: 500 })
  }
}

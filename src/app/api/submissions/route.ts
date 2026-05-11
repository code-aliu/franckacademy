import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getUserBySupabaseId } from "@/services/progress.service"
import { extractTextFromImage } from "@/services/ocr.service"
import { sendMessage } from "@/services/conversation.service"
import type { Subject } from "@/types/database"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getUserBySupabaseId(user.id)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { imageUrl, subject }: { imageUrl: string; subject: Subject } =
      await request.json()

    if (!imageUrl || !subject) {
      return NextResponse.json(
        { error: "imageUrl and subject are required" },
        { status: 400 }
      )
    }

    // 1. Run OCR
    const ocr = await extractTextFromImage(imageUrl)

    if (!ocr.cleanedText?.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from image" },
        { status: 422 }
      )
    }

    // 2. Create conversation + send first AI message
    const chatResult = await sendMessage(
      dbUser.id,
      subject,
      ocr.cleanedText,
      undefined,
      dbUser.grade ?? undefined
    )

    // 3. Persist the submission record
    await prisma.homeworkSubmission.create({
      data: {
        userId: dbUser.id,
        conversationId: chatResult.conversation.id,
        subject,
        rawImageUrl: imageUrl,
        extractedText: ocr.rawText,
        ocrConfidence: ocr.confidence,
        processedText: ocr.cleanedText,
        status: "COMPLETED",
      },
    })

    return NextResponse.json({
      data: {
        conversationId: chatResult.conversation.id,
        extractedText: ocr.cleanedText,
        ocrConfidence: ocr.confidence,
        assistantMessage: chatResult.assistantMessage,
      },
      error: null,
    })
  } catch (error) {
    console.error("[POST /api/submissions]", error)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}

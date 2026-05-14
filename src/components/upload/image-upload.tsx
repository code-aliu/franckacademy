"use client"

import { useCallback, useState } from "react"
import { Upload, X, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  onError?: (error: string) => void
  subject?: string
}

export function ImageUpload({ onUploadComplete, onError, subject: _subject }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        onError?.("Please upload an image file (JPG, PNG, WEBP)")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        onError?.("Image must be under 10MB")
        return
      }

      setIsUploading(true)
      setProgress(0)
      setFileName(file.name)
      setPreview(URL.createObjectURL(file))

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error("Not authenticated")

        const ext = file.name.split(".").pop()
        const path = `${session.user.id}/${Date.now()}.${ext}`
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const uploadUrl = `${supabaseUrl}/storage/v1/object/homework-images/${path}`

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open("POST", uploadUrl)
          xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.setRequestHeader("x-upsert", "false")

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100))
            }
          })

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(xhr.responseText || "Upload failed"))
            }
          }
          xhr.onerror = () => reject(new Error("Network error during upload"))
          xhr.send(file)
        })

        const { data: { publicUrl } } = supabase.storage
          .from("homework-images")
          .getPublicUrl(path)

        onUploadComplete(publicUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        onError?.(message)
        setPreview(null)
        setFileName("")
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [onUploadComplete, onError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function clearPreview() {
    setPreview(null)
    setFileName("")
  }

  if (preview) {
    return (
      <div className="relative rounded-xl border bg-muted/30 overflow-hidden">
        <img
          src={preview}
          alt="Uploaded homework"
          className="w-full max-h-64 object-contain"
        />
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <div className="w-48 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs font-medium text-foreground">
                {progress < 100 ? `Uploading… ${progress}%` : "Processing…"}
              </p>
            </div>
          </div>
        )}
        {!isUploading && (
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="px-3 py-2 text-xs text-muted-foreground truncate border-t">
          <FileImage className="inline h-3 w-3 mr-1" />
          {fileName}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop your homework image here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or tap to take a photo / browse files
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          JPG, PNG, WEBP up to 10MB
        </p>
      </div>
    </div>
  )
}

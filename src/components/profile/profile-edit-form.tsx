"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { updateProfileAction } from "@/app/(dashboard)/profile/actions"

const GRADE_OPTIONS = [
  "Year 7 / Form 1",
  "Year 8 / Form 2",
  "Year 9 / Form 3",
  "Year 10 / Form 4",
  "Year 11 / Form 5",
  "Year 12 / Lower Sixth",
  "Year 13 / Upper Sixth",
]

interface ProfileEditFormProps {
  initialName: string
  initialGrade: string | null
}

export function ProfileEditForm({ initialName, initialGrade }: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateProfileAction(formData)
        setIsEditing(false)
        toast({ title: "Profile updated" })
      } catch (err) {
        toast({
          title: "Update failed",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        })
      }
    })
  }

  if (!isEditing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
        Edit profile
      </Button>
    )
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Full name
        </Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={initialName}
          required
          minLength={2}
          maxLength={80}
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="grade" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Grade / Year
        </Label>
        <select
          id="grade"
          name="grade"
          defaultValue={initialGrade ?? ""}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Not set</option>
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId, updateUser } from "@/services/progress.service"

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) throw new Error("User not found")

  const fullName = (formData.get("fullName") as string)?.trim()
  const grade = (formData.get("grade") as string)?.trim() || null

  if (!fullName || fullName.length < 2) throw new Error("Name must be at least 2 characters")

  await updateUser(dbUser.id, { fullName, grade })
  revalidatePath("/profile")
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserBySupabaseId } from "@/services/progress.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { formatDate } from "@/lib/utils"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) redirect("/login")

  const initials = dbUser.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your account information
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={dbUser.avatarUrl ?? ""} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{dbUser.fullName}</h2>
              <p className="text-sm text-muted-foreground">{dbUser.email}</p>
              {dbUser.grade && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {dbUser.grade}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Account details</CardTitle>
              <CardDescription>Basic information about your account</CardDescription>
            </div>
            <ProfileEditForm initialName={dbUser.fullName} initialGrade={dbUser.grade} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Full name", value: dbUser.fullName },
            { label: "Email address", value: dbUser.email },
            { label: "Grade / Year", value: dbUser.grade ?? "Not set" },
            { label: "Member since", value: formatDate(dbUser.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 border-b pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
              <p className="text-sm text-foreground">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {dbUser.profile && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Learning profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Total questions asked
              </p>
              <p className="text-2xl font-bold text-foreground">
                {dbUser.profile.totalQuestions}
              </p>
            </div>
            {dbUser.profile.weakSubjects.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Focus areas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dbUser.profile.weakSubjects.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-xs capitalize">
                      {s.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

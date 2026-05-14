import { prisma } from "@/lib/prisma"
import type { ProgressOverview } from "@/types/api"

export async function getProgressOverview(userId: string): Promise<ProgressOverview> {
  const [profile, subjectProgress, recentConversations] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.subjectProgress.findMany({
      where: { userId },
      orderBy: { questionsAsked: "desc" },
    }),
    prisma.conversation.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  return {
    totalSessions: profile?.totalSessions ?? 0,
    totalQuestions: profile?.totalQuestions ?? 0,
    streakDays: profile?.streakDays ?? 0,
    subjectProgress,
    recentConversations,
  }
}

export async function getUserBySupabaseId(supabaseId: string) {
  return prisma.user.findUnique({
    where: { supabaseId },
    include: {
      profile: true,
      progress: true,
    },
  })
}

export async function createUserWithProfile(data: {
  supabaseId: string
  email: string
  fullName: string
  grade?: string
}) {
  return prisma.user.create({
    data: {
      ...data,
      profile: {
        create: {
          weakSubjects: [],
          strongSubjects: [],
        },
      },
    },
    include: { profile: true, progress: true },
  })
}

export async function updateUser(
  userId: string,
  data: { fullName?: string; grade?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    include: { profile: true, progress: true },
  })
}

export async function updateStreakIfNeeded(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return

  const now = new Date()
  const last = profile.lastActiveAt
  const msSinceMidnight = (d: Date) => {
    const local = new Date(d)
    return local.getHours() * 3600000 + local.getMinutes() * 60000 + local.getSeconds() * 1000
  }
  const daysBetween = Math.floor(
    (now.getTime() - msSinceMidnight(now) - (last.getTime() - msSinceMidnight(last))) /
      86400000
  )

  let newStreak = profile.streakDays
  if (daysBetween === 0) return // already logged in today
  if (daysBetween === 1) newStreak = profile.streakDays + 1
  else newStreak = 1 // streak broken

  await prisma.studentProfile.update({
    where: { userId },
    data: { streakDays: newStreak, lastActiveAt: now },
  })
}

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

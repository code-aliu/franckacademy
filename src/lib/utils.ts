import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    MATHEMATICS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PHYSICS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    CHEMISTRY: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ENGLISH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  }
  return colors[subject] ?? "bg-gray-100 text-gray-700"
}

export function getSubjectIcon(subject: string): string {
  const icons: Record<string, string> = {
    MATHEMATICS: "calculator",
    PHYSICS: "zap",
    CHEMISTRY: "flask-conical",
    ENGLISH: "book-open",
  }
  return icons[subject] ?? "book"
}

export function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    MATHEMATICS: "Mathematics",
    PHYSICS: "Physics",
    CHEMISTRY: "Chemistry",
    ENGLISH: "English",
  }
  return labels[subject] ?? subject
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

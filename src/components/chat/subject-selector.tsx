"use client"

import { Calculator, Zap, FlaskConical, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Subject } from "@/types/database"

const subjects: Array<{ value: Subject; label: string; icon: React.ElementType; color: string }> = [
  {
    value: "MATHEMATICS",
    label: "Mathematics",
    icon: Calculator,
    color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  {
    value: "PHYSICS",
    label: "Physics",
    icon: Zap,
    color: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
  {
    value: "CHEMISTRY",
    label: "Chemistry",
    icon: FlaskConical,
    color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  {
    value: "ENGLISH",
    label: "English",
    icon: BookOpen,
    color: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  },
]

interface SubjectSelectorProps {
  value: Subject | null
  onChange: (subject: Subject) => void
}

export function SubjectSelector({ value, onChange }: SubjectSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {subjects.map(({ value: subjectValue, label, icon: Icon, color }) => (
        <button
          key={subjectValue}
          type="button"
          onClick={() => onChange(subjectValue)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-150 cursor-pointer",
            color,
            value === subjectValue
              ? "ring-2 ring-primary ring-offset-2 shadow-md scale-[1.02]"
              : "opacity-75 hover:opacity-100"
          )}
        >
          <Icon className="h-6 w-6" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}

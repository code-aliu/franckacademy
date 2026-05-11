import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-2">
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <BookOpen className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
      </div>
    </div>
  )
}

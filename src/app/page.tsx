import Link from "next/link"
import {
  BookOpen,
  Calculator,
  Zap,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Brain,
  Camera,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Tutoring",
    description:
      "Get clear, step-by-step explanations tailored to your level. Our AI acts like a patient tutor, not an answer machine.",
  },
  {
    icon: Camera,
    title: "Photo Your Homework",
    description:
      "Take a photo of your homework and our AI will read it, extract the question, and guide you through the solution.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description:
      "See which subjects and topics you're improving in. Build streaks, identify weak areas, and study smarter.",
  },
]

const subjects = [
  { icon: Calculator, label: "Mathematics", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { icon: Zap, label: "Physics", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
  { icon: FlaskConical, label: "Chemistry", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
  { icon: BookOpen, label: "English", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
]

const benefits = [
  "Step-by-step explanations, never just answers",
  "Works with typed questions or homework photos",
  "Adapts to your grade and learning style",
  "Available 24/7 — study on your schedule",
  "Tracks topics you struggle with",
  "Designed for secondary school students",
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">
              Franck<span className="text-primary">Academy</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center gap-6 px-4 py-20 text-center sm:py-32">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          AI Tutor for Secondary School Students
        </Badge>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Learn smarter, not harder with your{" "}
          <span className="text-primary">AI tutor</span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
          FranckAcademy guides you through homework step-by-step, explains
          concepts clearly, and helps you truly understand — not just copy answers.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              Start learning free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        {/* Subject pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {subjects.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${color}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to excel
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built specifically for secondary school students preparing for exams
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                A tutor that actually teaches
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Unlike answer websites, FranckAcademy is designed to make you
                smarter. Every response explains the why, not just the what.
              </p>
              <ul className="mt-6 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
                    <span className="text-sm text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild className="gap-2">
                  <Link href="/signup">
                    Try it free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mock chat preview */}
            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
              <div className="border-b bg-muted/50 px-4 py-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <span className="ml-2 text-xs text-muted-foreground font-medium">
                  Mathematics · Quadratic Equations
                </span>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0">S</div>
                  <div className="rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm max-w-[80%]">
                    How do I solve x² + 5x + 6 = 0?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border px-3 py-2 text-sm max-w-[85%] space-y-1">
                    <p className="font-medium">Great question! This is a quadratic equation.</p>
                    <p className="text-muted-foreground">Let&apos;s use factoring. We need two numbers that multiply to <strong>6</strong> and add to <strong>5</strong>...</p>
                    <p className="text-primary text-xs font-medium">→ Step 1: Find the factors...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Ready to ace your exams?
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Join students already using FranckAcademy to study smarter.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 gap-2"
            asChild
          >
            <Link href="/signup">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
            <BookOpen className="h-3 w-3 text-primary-foreground" />
          </div>
          <span>FranckAcademy © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}

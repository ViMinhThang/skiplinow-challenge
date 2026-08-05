import { Suspense } from "react"
import { Loader2Icon } from "lucide-react"

import { SetupForm } from "@/components/auth/setup-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        }
      >
        <SetupForm />
      </Suspense>
    </main>
  )
}

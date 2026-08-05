"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuthStore } from "@/stores/auth"

export default function LoginPage() {
  const router = useRouter()
  const session = useAuthStore((state) => state.session)

  useEffect(() => {
    if (session) {
      router.replace("/dashboard")
    }
  }, [session, router])

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </main>
  )
}

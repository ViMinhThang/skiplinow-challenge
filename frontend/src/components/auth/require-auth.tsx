"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/stores/auth"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useAuthStore((state) => state.session)
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated() ?? false,
  )

  useEffect(() => {
    return useAuthStore.persist?.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (hydrated && !session) {
      router.replace("/login")
    }
  }, [hydrated, session, router])

  if (!hydrated || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return children
}

"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/stores/auth"
import type { UserRole } from "@/types"

interface RequireAuthProps {
  children: React.ReactNode
  /** When set, users with a different role are redirected to their home. */
  role?: UserRole
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const session = useAuthStore((state) => state.session)
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist?.hasHydrated() ?? false,
  )

  useEffect(() => {
    return useAuthStore.persist?.onFinishHydration(() => setHydrated(true))
  }, [])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    redirect("/login")
  }
  if (role && session.user.role !== role) {
    redirect(session.user.role === "owner" ? "/dashboard" : "/workspace")
  }

  return children
}

"use client"

import { LogOutIcon } from "lucide-react"

import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthStore, useCurrentUser } from "@/stores/auth"

function Dashboard() {
  const user = useCurrentUser()
  const logout = useAuthStore((state) => state.logout)

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {user?.name}</CardTitle>
          <CardDescription>
            Owner dashboard is coming in the next phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button variant="outline" onClick={logout}>
            <LogOutIcon />
            Log out
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  )
}

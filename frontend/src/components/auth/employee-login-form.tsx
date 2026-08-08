"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  KeyRoundIcon,
  Loader2Icon,
  LogInIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/format"
import { formMessage, loginFormSchema } from "@/lib/schemas"
import { login } from "@/services/auth"
import { useAuthStore } from "@/stores/auth"

export function EmployeeLoginForm() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const formError = formMessage(loginFormSchema.safeParse({ username, password }))
    if (formError) {
      setError(formError)
      return
    }
    setLoading(true)
    try {
      const response = await login(username.trim(), password)
      setSession(
        { token: response.token, user: response.user },
        response.user.phone,
      )
      toast.success("Signed in successfully.")
      router.push("/workspace")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee-username">Username</Label>
        <IconInput
          id="employee-username"
          icon={<UserIcon />}
          autoComplete="username"
          placeholder="e.g. sam"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee-password">Password</Label>
        <IconInput
          id="employee-password"
          icon={<KeyRoundIcon />}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
        />
      </div>

      {error && <FormError message={error} />}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <>
            <LogInIcon />
            Sign in
            <ArrowRightIcon />
          </>
        )}
      </Button>
    </form>
  )
}

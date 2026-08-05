"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRightIcon,
  KeyRoundIcon,
  Loader2Icon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconInput } from "@/components/ui/icon-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/format"
import { setupAccount } from "@/services/auth"

export function SetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="size-5 text-warning" />
            Invalid invite link
          </CardTitle>
          <CardDescription>
            This link is missing its verification token. Ask your manager to
            resend the invite email.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  const setupToken: string = token

  function validate(): string | null {
    if (username.trim().length < 3) {
      return "Username must be at least 3 characters."
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters."
    }
    if (password !== confirmPassword) {
      return "Passwords do not match."
    }
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    try {
      await setupAccount(setupToken, username.trim(), password)
      toast.success("Account created. You can now sign in.")
      router.push("/login")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="size-5" />
          Set up your account
        </CardTitle>
        <CardDescription>
          Choose a username and password to activate your employee account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-username">Username</Label>
            <IconInput
              id="setup-username"
              icon={<UserIcon />}
              autoComplete="username"
              placeholder="e.g. jordan"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-password">Password</Label>
            <IconInput
              id="setup-password"
              icon={<KeyRoundIcon />}
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-confirm">Confirm password</Label>
            <Input
              id="setup-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading}
            />
          </div>

          {error && <FormError message={error} />}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRightIcon />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

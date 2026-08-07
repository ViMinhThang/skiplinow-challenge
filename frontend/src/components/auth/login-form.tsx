"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  Loader2Icon,
  SmartphoneIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/format"
import { requestAccessCode, verifyAccessCode } from "@/services/auth"
import { useAuthStore } from "@/stores/auth"

type Step = "phone" | "code"

export function LoginForm() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [devCode, setDevCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!phone.trim()) {
      setError("Please enter your phone number.")
      return
    }
    setLoading(true)
    try {
      const response = await requestAccessCode(phone.trim())
      setDevCode(response.devCode ?? null)
      setStep("code")
      toast.success(response.message)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Please enter the 6-digit access code.")
      return
    }
    setLoading(true)
    try {
      const response = await verifyAccessCode(phone.trim(), code.trim())
      setSession(
        { token: response.token, user: response.user },
        phone.trim(),
      )
      toast.success("Logged in successfully.")
      router.push("/dashboard")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setStep("phone")
    setCode("")
    setDevCode(null)
    setError(null)
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {step === "phone"
          ? "Enter your registered phone number to receive an access code."
          : `Enter the 6-digit code sent to ${phone}.`}
      </p>
      {step === "phone" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <IconInput
                id="phone"
                icon={<SmartphoneIcon />}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 555-0100"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={loading}
              />
            </div>

            {error && <FormError message={error} />}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <>
                  Send code
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Access code</Label>
              <IconInput
                id="code"
                icon={<KeyRoundIcon />}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                className="tracking-widest"
                disabled={loading}
                autoFocus
              />
            </div>

            {devCode && (
              <p className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                <CircleCheckIcon className="size-3.5 shrink-0 text-success" />
                Dev SMS: your code is{" "}
                <span className="font-semibold text-foreground">
                  {devCode}
                </span>
              </p>
            )}

            {error && <FormError message={error} />}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                aria-label="Back to phone number"
              >
                <ArrowLeftIcon />
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <>
                    Verify
                    <ArrowRightIcon />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
    </>
  )
}

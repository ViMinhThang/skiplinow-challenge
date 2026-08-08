"use client"

import { useState } from "react"
import { Loader2Icon, MailIcon, SaveIcon, SmartphoneIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { IconInput } from "@/components/ui/icon-input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/format"
import { formMessage, profileFormSchema } from "@/lib/schemas"
import { updateOwnProfile } from "@/services/auth"
import { useAuthStore, useCurrentUser } from "@/stores/auth"
import type { UserUpdateInput } from "@/types"

function validate(form: UserUpdateInput): string | null {
  return formMessage(profileFormSchema.safeParse(form))
}

export function ProfileForm() {
  const user = useCurrentUser()
  const updateUser = useAuthStore((state) => state.updateUser)
  const [form, setForm] = useState<UserUpdateInput>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof UserUpdateInput>(key: K, value: UserUpdateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (saving || !user) return
    setError(null)
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    try {
      const { user: updated } = await updateOwnProfile(form)
      updateUser(updated)
      setForm({
        name: updated.name,
        phone: updated.phone,
        email: updated.email ?? "",
      })
      toast.success("Profile updated.")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <IconInput
          id="profile-name"
          icon={<UserIcon />}
          placeholder="Full name"
          value={form.name ?? ""}
          onChange={(event) => set("name", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">Phone number</Label>
        <IconInput
          id="profile-phone"
          icon={<SmartphoneIcon />}
          type="tel"
          placeholder="e.g. 555-0101"
          value={form.phone ?? ""}
          onChange={(event) => set("phone", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <IconInput
          id="profile-email"
          icon={<MailIcon />}
          type="email"
          placeholder="name@company.com"
          value={form.email ?? ""}
          onChange={(event) => set("email", event.target.value)}
        />
      </div>

      {error && <FormError message={error} />}

      <Button type="submit" disabled={saving}>
        {saving ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SaveIcon />
        )}
        Save changes
      </Button>
    </form>
  )
}

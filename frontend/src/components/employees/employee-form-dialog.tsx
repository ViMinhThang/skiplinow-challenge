"use client"

import { useState } from "react"
import {
  Loader2Icon,
  MailIcon,
  SmartphoneIcon,
  TagIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/format"
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-employees"
import type { Employee, EmployeeInput } from "@/types"

const ROLE_OPTIONS = [
  "Staff",
  "Developer",
  "Designer",
  "Supervisor",
  "Manager",
]

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
}

function initialForm(employee?: Employee | null): EmployeeInput {
  return {
    name: employee?.name ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    role: employee?.role ?? ROLE_OPTIONS[0],
  }
}

function FormFields({
  employee,
}: {
  employee?: Employee | null
}) {
  const [form, setForm] = useState<EmployeeInput>(() => initialForm(employee))
  const [error, setError] = useState<string | null>(null)
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const isEditing = Boolean(employee)
  const loading = createMutation.isPending || updateMutation.isPending

  function set<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Name is required."
    if (!form.phone.trim()) return "Phone number is required."
    if (!/^\d{7,15}$/.test(form.phone.replace(/\D/g, ""))) {
      return "Phone number must contain 7–15 digits."
    }
    if (!form.email.trim()) return "Email is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address."
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
    try {
      if (isEditing && employee) {
        await updateMutation.mutateAsync({ id: employee.id, input: form })
        toast.success("Employee updated.")
      } else {
        await createMutation.mutateAsync(form)
        toast.success(`Invite email sent to ${form.email.trim()}.`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee-name">Name</Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="employee-name"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee-phone">Phone number</Label>
        <div className="relative">
          <SmartphoneIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="employee-phone"
            type="tel"
            placeholder="e.g. 555-0101"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee-email">Email</Label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="employee-email"
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee-role">Role</Label>
        <div className="flex items-center gap-2">
          <TagIcon className="size-4 shrink-0 text-muted-foreground" />
          <Select value={form.role} onValueChange={(value) => set("role", value)}>
            <SelectTrigger id="employee-role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Add employee"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? "Update the employee's profile details."
              : "Adding an employee sends them an email with a link to set up their account."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormFields key={employee?.id ?? "new"} employee={employee} />
        )}
      </DialogContent>
    </Dialog>
  )
}

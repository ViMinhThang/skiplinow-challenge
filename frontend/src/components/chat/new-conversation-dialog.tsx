"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormError } from "@/components/auth/form-error"
import { useCreateConversation } from "@/hooks/use-chat"
import { getErrorMessage, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConversationView, Employee } from "@/types"

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerId: string
  employees?: Employee[]
  existingEmployeeIds: string[]
  onCreated: (conversation: ConversationView) => void
}

export function NewConversationDialog({
  open,
  onOpenChange,
  ownerId,
  employees = [],
  existingEmployeeIds,
  onCreated,
}: NewConversationDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const createMutation = useCreateConversation()

  const existingIds = new Set(existingEmployeeIds)
  const available = employees.filter(
    (employee) => !existingIds.has(employee.id),
  )

  async function handleStart() {
    if (!selectedId) return
    setError(null)
    try {
      const conversation = await createMutation.mutateAsync({
        ownerId,
        employeeId: selectedId,
      })
      toast.success("Conversation started.")
      onOpenChange(false)
      onCreated(conversation)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedId(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Pick a team member to start chatting with.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {available.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You already have a conversation with every employee.
            </p>
          ) : (
            available.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelectedId(employee.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                  selectedId === employee.id && "bg-sidebar-accent",
                )}
              >
                <Avatar className="size-8">
                  <AvatarFallback>{initials(employee.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.role}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {error && <FormError message={error} />}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedId || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Start chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

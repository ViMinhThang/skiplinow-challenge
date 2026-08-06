"use client"

import { useState } from "react"
import { Loader2Icon, Trash2Icon } from "lucide-react"
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
import { useDeleteTask } from "@/hooks/use-tasks"
import { getErrorMessage } from "@/lib/format"
import type { Task } from "@/types"

export function DeleteTaskDialog({
  task,
  onOpenChange,
}: {
  task: Task | null
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const deleteMutation = useDeleteTask()
  const open = Boolean(task)

  async function handleDelete() {
    if (!task) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(task.id)
      toast.success("Task removed.")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete task?</DialogTitle>
          <DialogDescription>
            {task ? (
              <>
                <span className="font-medium text-foreground">
                  “{task.title}”
                </span>{" "}
                will be removed permanently.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            Delete task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

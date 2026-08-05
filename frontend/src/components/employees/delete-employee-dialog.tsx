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
import { getErrorMessage } from "@/lib/format"
import { useDeleteEmployee } from "@/hooks/use-employees"
import type { Employee } from "@/types"

interface DeleteEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: DeleteEmployeeDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const deleteMutation = useDeleteEmployee()

  async function handleDelete() {
    if (!employee) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(employee.id)
      toast.success(`${employee.name} removed.`)
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete employee</DialogTitle>
          <DialogDescription>
            This will permanently remove{" "}
            <span className="font-medium text-foreground">{employee?.name}</span>{" "}
            and their data from the system. This action cannot be undone.
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
              <Trash2Icon />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

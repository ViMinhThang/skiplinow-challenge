"use client"

import { useState } from "react"
import { CalendarIcon, ClipboardListIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconInput } from "@/components/ui/icon-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEmployees } from "@/hooks/use-employees"
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks"
import { getErrorMessage } from "@/lib/format"
import { formMessage, taskFormSchema } from "@/lib/schemas"
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/tasks"
import type { Task, TaskUpdateInput } from "@/types"

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}

function initialForm(task?: Task | null): TaskUpdateInput {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assigneeId ?? "",
    dueDate: task?.dueDate ?? "",
    status: task?.status ?? "todo",
  }
}

function FormFields({ task }: { task?: Task | null }) {
  const [form, setForm] = useState<TaskUpdateInput>(() => initialForm(task))
  const [error, setError] = useState<string | null>(null)
  const employeesQuery = useEmployees()
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const isEditing = Boolean(task)
  const loading = createMutation.isPending || updateMutation.isPending
  const assigneeOptions = employeesQuery.data ?? []

  function set<K extends keyof TaskUpdateInput>(
    key: K,
    value: TaskUpdateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): string | null {
    return formMessage(taskFormSchema.safeParse(form))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    try {
      if (isEditing && task) {
        await updateMutation.mutateAsync({ id: task.id, input: form })
        toast.success("Task updated.")
      } else {
        const parsed = taskFormSchema.parse(form)
        await createMutation.mutateAsync({
          title: parsed.title,
          description: parsed.description,
          assigneeId: parsed.assigneeId,
          dueDate: parsed.dueDate,
        })
        toast.success("Task created.")
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <IconInput
          id="task-title"
          icon={<ClipboardListIcon />}
          placeholder="What needs to be done?"
          value={form.title ?? ""}
          onChange={(event) => set("title", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          placeholder="Add details, links or context (optional)"
          value={form.description ?? ""}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-assignee">Assignee</Label>
          <Select
            value={form.assigneeId ?? ""}
            onValueChange={(value) => set("assigneeId", value)}
            disabled={employeesQuery.isLoading}
          >
            <SelectTrigger id="task-assignee" className="w-full">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {assigneeOptions.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-due">Due date</Label>
          <IconInput
            id="task-due"
            icon={<CalendarIcon />}
            type="date"
            value={form.dueDate ?? ""}
            onChange={(event) => set("dueDate", event.target.value)}
          />
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select
            value={form.status ?? "todo"}
            onValueChange={(value) => set("status", value as Task["status"])}
          >
            <SelectTrigger id="task-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && <FormError message={error} />}

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Update the task details and status."
              : "Assign a new task to an employee."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormFields key={task?.id ?? "new"} task={task} />
        )}
      </DialogContent>
    </Dialog>
  )
}

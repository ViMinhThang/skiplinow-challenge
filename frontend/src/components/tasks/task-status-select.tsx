"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/format"
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { useUpdateTask } from "@/hooks/use-tasks"
import type { Task } from "@/types"

export function TaskStatusSelect({
  task,
  className,
  size = "sm",
}: {
  task: Task
  className?: string
  size?: "sm" | "default"
}) {
  const updateMutation = useUpdateTask()
  const [status, setStatus] = useState(task.status)

  useEffect(() => {
    setStatus(task.status)
  }, [task.status])

  function handleChange(value: string) {
    const next = value as Task["status"]
    setStatus(next)
    updateMutation.mutate(
      { id: task.id, input: { status: next } },
      {
        onError: (error) => {
          setStatus(task.status)
          toast.error(getErrorMessage(error))
        },
      },
    )
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={updateMutation.isPending}>
      <SelectTrigger
        size={size}
        className={cn("w-32", className)}
        aria-label="Change task status"
      >
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
  )
}

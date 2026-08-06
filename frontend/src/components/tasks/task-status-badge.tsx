import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types"

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "",
  in_progress: "bg-warning/10 text-warning",
  done: "bg-success/10 text-success",
}

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <Badge variant="default" className={cn(STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

"use client"

import {
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  RefreshCwIcon,
} from "lucide-react"

import { TaskStatusSelect } from "@/components/tasks/task-status-select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/stores/auth"
import { useTasks } from "@/hooks/use-tasks"
import { formatMonthDay, formatShortDate } from "@/lib/date"
import { getErrorMessage } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"

function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null
  return formatMonthDay(dueDate)
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false
  return new Date(`${task.dueDate}T00:00:00`) < new Date()
}

function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const dueDate = formatDueDate(task.dueDate)
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <CardTitle className="text-base">{task.title}</CardTitle>
        <TaskStatusSelect task={task} size="default" className="w-36 shrink-0" />
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              isOverdue(task) && "font-medium text-destructive",
            )}
          >
            <CalendarIcon className="size-3.5" />
            {isOverdue(task) ? "Overdue" : dueDate ? `Due ${dueDate}` : "No due date"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2Icon className="size-3.5" />
            Created {formatShortDate(task.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function WorkspaceTasksPage() {
  const user = useCurrentUser()
  const { data: tasks, isLoading, isError, error, refetch } = useTasks()

  const myTasks =
    tasks?.filter((task) => task.assigneeId === user?.id) ?? []
  const doneCount = myTasks.filter((task) => task.status === "done").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">My tasks</h1>
          <p className="text-sm text-muted-foreground">
            {myTasks.length === 0
              ? "You have no assigned tasks yet."
              : `${doneCount} of ${myTasks.length} task(s) done.`}
          </p>
        </div>
      </div>

      {isLoading && <LoadingCards />}

      {!isLoading && isError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCwIcon />
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && myTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ClipboardListIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tasks assigned to you yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Your manager will assign tasks here.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && myTasks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {myTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import {
  CalendarIcon,
  ClipboardListIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TaskStatusSelect } from "@/components/tasks/task-status-select"
import { useEmployees } from "@/hooks/use-employees"
import { formatMonthDay } from "@/lib/date"
import { getErrorMessage, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Employee, Task } from "@/types"

const TABLE_COLUMNS = 5

interface TasksTableProps {
  tasks?: Task[]
  isLoading: boolean
  isError: boolean
  error: unknown
  emptyMessage: string
  onRetry: () => void
  onAdd: () => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-7 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={TABLE_COLUMNS}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{message}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCwIcon />
            Try again
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyRow({ message, onAdd }: { message: string; onAdd: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={TABLE_COLUMNS}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <ClipboardListIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button variant="outline" onClick={onAdd}>
            <PlusIcon />
            New task
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function formatDueDate(dueDate?: string): string {
  if (!dueDate) return "No due date"
  return formatMonthDay(dueDate)
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false
  return new Date(`${task.dueDate}T00:00:00`) < new Date()
}

function TaskRow({
  task,
  assignee,
  onEdit,
  onDelete,
}: {
  task: Task
  assignee?: Employee
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{task.title}</p>
        {task.description && (
          <p className="max-w-md truncate text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">
              {initials(assignee?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{assignee?.name ?? "Unassigned"}</span>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm text-muted-foreground",
            isOverdue(task) && "font-medium text-destructive",
          )}
        >
          <CalendarIcon className="size-3.5" />
          {formatDueDate(task.dueDate)}
        </span>
      </TableCell>
      <TableCell>
        <TaskStatusSelect task={task} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${task.title}`}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TasksTable({
  tasks,
  isLoading,
  isError,
  error,
  emptyMessage,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: TasksTableProps) {
  const employeesQuery = useEmployees()
  const employeesById = new Map(
    (employeesQuery.data ?? []).map((employee) => [employee.id, employee]),
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <LoadingRows />}

        {!isLoading && isError && (
          <ErrorRow message={getErrorMessage(error)} onRetry={onRetry} />
        )}

        {!isLoading && !isError && tasks?.length === 0 && (
          <EmptyRow message={emptyMessage} onAdd={onAdd} />
        )}

        {!isLoading &&
          !isError &&
          tasks?.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              assignee={employeesById.get(task.assigneeId)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
      </TableBody>
    </Table>
  )
}

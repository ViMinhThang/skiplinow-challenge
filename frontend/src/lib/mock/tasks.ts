import { ApiError } from "@/lib/api"
import {
  delay,
  findEmployeeById,
  getDatabase,
  persistDatabase,
} from "@/lib/mock/db"
import type {
  Task,
  TaskInput,
  TaskStatus,
  TaskUpdateInput,
} from "@/types"

function nowIso(): string {
  return new Date().toISOString()
}

function toTaskId(db: ReturnType<typeof getDatabase>): string {
  return `task-${Date.now().toString(36)}`
}

function requireTask(
  db: ReturnType<typeof getDatabase>,
  id: string,
): Task {
  const task = db.tasks.find((t) => t.id === id)
  if (!task) throw new ApiError(404, "Task not found.")
  return task
}

function assertAssignee(db: ReturnType<typeof getDatabase>, id: string): void {
  if (!findEmployeeById(db, id)) {
    throw new ApiError(400, "Assignee must be an existing employee.")
  }
}

export async function mockListTasks(): Promise<Task[]> {
  await delay(250)
  const db = getDatabase()
  return [...db.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function mockCreateTask(input: TaskInput): Promise<Task> {
  await delay()
  const db = getDatabase()
  const title = input.title.trim()
  if (!title) throw new ApiError(400, "Task title is required.")
  assertAssignee(db, input.assigneeId)

  const now = nowIso()
  const task: Task = {
    id: toTaskId(db),
    title,
    description: input.description?.trim() || undefined,
    status: "todo",
    assigneeId: input.assigneeId,
    createdBy: "owner-1",
    dueDate: input.dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  }
  db.tasks.push(task)
  persistDatabase(db)
  return task
}

export async function mockUpdateTask(
  id: string,
  input: TaskUpdateInput,
): Promise<Task> {
  await delay()
  const db = getDatabase()
  const task = requireTask(db, id)

  if (input.title !== undefined && !input.title.trim()) {
    throw new ApiError(400, "Task title is required.")
  }
  if (input.assigneeId) assertAssignee(db, input.assigneeId)

  if (input.title !== undefined) task.title = input.title.trim()
  if (input.description !== undefined) {
    task.description = input.description.trim() || undefined
  }
  if (input.status !== undefined) task.status = input.status
  if (input.assigneeId) task.assigneeId = input.assigneeId
  if (input.dueDate !== undefined) task.dueDate = input.dueDate || undefined
  task.updatedAt = nowIso()
  persistDatabase(db)
  return task
}

export async function mockDeleteTask(id: string): Promise<{ message: string }> {
  await delay()
  const db = getDatabase()
  const index = db.tasks.findIndex((t) => t.id === id)
  if (index === -1) throw new ApiError(404, "Task not found.")
  db.tasks.splice(index, 1)
  persistDatabase(db)
  return { message: "Task removed." }
}

export function isValidTaskStatus(value: string): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done"
}

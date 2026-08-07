import { getAdapter } from "../db.js"
import { HttpError } from "../app.js"
import { getEmployeeRecord } from "./employees.js"

const TASKS_COLLECTION = "tasks"

export type TaskStatus = "todo" | "in_progress" | "done"

export interface TaskRecord {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assigneeId: string
  createdBy: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title: string
  description?: string
  assigneeId: string
  dueDate?: string
}

export interface TaskUpdateInput {
  title?: string
  description?: string
  assigneeId?: string
  dueDate?: string
  status?: TaskStatus
}

function toId(): string {
  return `task-${Date.now().toString(36)}`
}

function isStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done"
}

function toTask(record: { id: string; [key: string]: unknown }): TaskRecord {
  return {
    id: record.id,
    title: String(record.title ?? ""),
    description: record.description ? String(record.description) : undefined,
    status: isStatus(record.status) ? record.status : "todo",
    assigneeId: String(record.assigneeId ?? ""),
    createdBy: String(record.createdBy ?? ""),
    dueDate: record.dueDate ? String(record.dueDate) : undefined,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
  }
}

async function findRecord(id: string): Promise<TaskRecord | null> {
  const db = getAdapter()
  const record = await db.get(TASKS_COLLECTION, id)
  return record ? toTask(record) : null
}

async function listRecords(): Promise<TaskRecord[]> {
  const db = getAdapter()
  const records = await db.list(TASKS_COLLECTION)
  return records
    .map(toTask)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listTasks(): Promise<TaskRecord[]> {
  return listRecords()
}

export async function createTask(
  input: TaskInput,
  createdBy: string,
): Promise<TaskRecord> {
  const title = input.title?.trim() ?? ""
  if (!title) throw new HttpError(400, "Task title is required.")
  if (!input.assigneeId) throw new HttpError(400, "Please choose an assignee.")

  const assignee = await getEmployeeRecord(input.assigneeId)
  if (!assignee) {
    throw new HttpError(400, "Assignee must be an existing employee.")
  }

  const db = getAdapter()
  const now = new Date().toISOString()
  const task: TaskRecord = {
    id: toId(),
    title,
    description: input.description?.trim() || undefined,
    status: "todo",
    assigneeId: assignee.id,
    createdBy,
    dueDate: input.dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  }
  await db.set(TASKS_COLLECTION, task.id, { ...task })
  return task
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
  actor: { id: string; role: "owner" | "employee" },
): Promise<TaskRecord> {
  const task = await findRecord(id)
  if (!task) throw new HttpError(404, "Task not found.")

  const isAssignee = task.assigneeId === actor.id
  if (actor.role !== "owner" && !isAssignee) {
    throw new HttpError(403, "You can only update your own tasks.")
  }
  if (actor.role !== "owner" && input.title !== undefined) {
    throw new HttpError(403, "Only the owner can edit task details.")
  }

  const next: TaskRecord = { ...task }
  if (input.title !== undefined) {
    if (!input.title.trim()) throw new HttpError(400, "Task title is required.")
    next.title = input.title.trim()
  }
  if (input.description !== undefined) {
    next.description = input.description.trim() || undefined
  }
  if (input.status !== undefined) {
    if (!isStatus(input.status)) throw new HttpError(400, "Invalid status.")
    next.status = input.status
  }
  if (input.assigneeId !== undefined) {
    const assignee = await getEmployeeRecord(input.assigneeId)
    if (!assignee) {
      throw new HttpError(400, "Assignee must be an existing employee.")
    }
    next.assigneeId = assignee.id
  }
  if (input.dueDate !== undefined) {
    next.dueDate = input.dueDate || undefined
  }
  next.updatedAt = new Date().toISOString()

  const db = getAdapter()
  await db.set(TASKS_COLLECTION, id, { ...next })
  return next
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  const task = await findRecord(id)
  if (!task) throw new HttpError(404, "Task not found.")
  const db = getAdapter()
  await db.remove(TASKS_COLLECTION, id)
  return { message: "Task removed." }
}

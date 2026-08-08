import { getAdapter } from "../db.js"
import { HttpError } from "../errors/http-error.js"
import { generateId } from "../utils/id.js"
import { taskRecordSchema } from "../validation/schemas.js"
import { findEmployeeById } from "./employees.js"
import type { AuthUser } from "./tokens.js"

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

function parseTaskRecord(input: unknown): TaskRecord {
  const parsed = taskRecordSchema.safeParse(input)
  if (!parsed.success) {
    throw new HttpError(
      400,
      parsed.error.issues[0]?.message ?? "Invalid task data.",
    )
  }
  return parsed.data
}

function toTask(record: {
  id: string
  [key: string]: unknown
}): TaskRecord {
  return taskRecordSchema.parse(record)
}

async function findRecord(id: string): Promise<TaskRecord | null> {
  const db = getAdapter()
  const record = await db.get(TASKS_COLLECTION, id)
  return record ? toTask(record) : null
}

async function listRecords(): Promise<TaskRecord[]> {
  const db = getAdapter()
  const records = await db.list(TASKS_COLLECTION)
  return records.map(toTask).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function requireAssignee(assigneeId: string): Promise<void> {
  const assignee = await findEmployeeById(assigneeId)
  if (!assignee) {
    throw new HttpError(400, "Assignee must be an existing employee.")
  }
}

export async function listTasks(): Promise<TaskRecord[]> {
  return listRecords()
}

export async function createTask(
  input: TaskInput,
  createdBy: string,
): Promise<TaskRecord> {
  await requireAssignee(input.assigneeId)

  const now = new Date().toISOString()
  const task = parseTaskRecord({
    id: generateId("task"),
    title: input.title,
    description: input.description,
    status: "todo",
    assigneeId: input.assigneeId,
    createdBy,
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  })

  const db = getAdapter()
  await db.set(TASKS_COLLECTION, task.id, { ...task })
  return task
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
  actor: AuthUser,
): Promise<TaskRecord> {
  const task = await findRecord(id)
  if (!task) throw new HttpError(404, "Task not found.")

  if (actor.role !== "owner") {
    if (task.assigneeId !== actor.id) {
      throw new HttpError(403, "You can only update your own tasks.")
    }
    const hasDetailEdits = [
      input.title,
      input.description,
      input.assigneeId,
      input.dueDate,
    ].some((value) => value !== undefined)
    if (hasDetailEdits) {
      throw new HttpError(403, "Only the owner can edit task details.")
    }
  }

  if (input.assigneeId !== undefined) {
    await requireAssignee(input.assigneeId)
  }

  const next = parseTaskRecord({
    ...task,
    ...input,
    updatedAt: new Date().toISOString(),
  })

  const db = getAdapter()
  await db.set(TASKS_COLLECTION, id, { ...next })
  return next
}

export async function deleteTask(
  id: string,
): Promise<{ message: string; task: TaskRecord }> {
  const task = await findRecord(id)
  if (!task) throw new HttpError(404, "Task not found.")
  const db = getAdapter()
  await db.remove(TASKS_COLLECTION, id)
  return { message: "Task removed.", task }
}

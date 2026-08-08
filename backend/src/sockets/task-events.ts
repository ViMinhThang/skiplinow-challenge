import type { TaskRecord } from "../services/tasks.js"
import { emitToUser } from "./io.js"

function emitToUsers(userIds: string[], event: string, payload: unknown): void {
  for (const userId of new Set(userIds)) {
    emitToUser(userId, event, payload)
  }
}

export function emitTaskCreated(task: TaskRecord): void {
  emitToUsers([task.assigneeId, task.createdBy], "task:created", { task })
}

export function emitTaskUpdated(task: TaskRecord): void {
  emitToUsers([task.assigneeId, task.createdBy], "task:updated", { task })
}

export function emitTaskDeleted(task: TaskRecord): void {
  emitToUsers([task.assigneeId, task.createdBy], "task:deleted", { task })
}

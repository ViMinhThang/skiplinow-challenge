import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import { messageResponseSchema, taskSchema } from "@/lib/schemas"
import type { Task, TaskInput, TaskUpdateInput } from "@/types"

export async function listTasks(): Promise<Task[]> {
  return api.get(API_ENDPOINTS.tasks, { schema: taskSchema.array() })
}

export async function createTask(input: TaskInput): Promise<Task> {
  return api.post(API_ENDPOINTS.tasks, input, { schema: taskSchema })
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
): Promise<Task> {
  return api.patch(API_ENDPOINTS.task(id), input, { schema: taskSchema })
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  return api.delete(API_ENDPOINTS.task(id), { schema: messageResponseSchema })
}

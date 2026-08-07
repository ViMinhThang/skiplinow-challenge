import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import type { Task, TaskInput, TaskUpdateInput } from "@/types"

export async function listTasks(): Promise<Task[]> {
  return api.get<Task[]>(API_ENDPOINTS.tasks)
}

export async function createTask(input: TaskInput): Promise<Task> {
  return api.post<Task>(API_ENDPOINTS.tasks, input)
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
): Promise<Task> {
  return api.patch<Task>(API_ENDPOINTS.task(id), input)
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(API_ENDPOINTS.task(id))
}

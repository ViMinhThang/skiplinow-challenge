import { api } from "@/lib/api"
import { API_ENDPOINTS, USE_MOCK } from "@/lib/constants"
import {
  mockCreateTask,
  mockDeleteTask,
  mockListTasks,
  mockUpdateTask,
} from "@/lib/mock/tasks"
import type { Task, TaskInput, TaskUpdateInput } from "@/types"

export async function listTasks(): Promise<Task[]> {
  if (USE_MOCK) return mockListTasks()
  return api.get<Task[]>(API_ENDPOINTS.tasks)
}

export async function createTask(input: TaskInput): Promise<Task> {
  if (USE_MOCK) return mockCreateTask(input)
  return api.post<Task>(API_ENDPOINTS.tasks, input)
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput,
): Promise<Task> {
  if (USE_MOCK) return mockUpdateTask(id, input)
  return api.patch<Task>(API_ENDPOINTS.task(id), input)
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockDeleteTask(id)
  return api.delete<{ message: string }>(API_ENDPOINTS.task(id))
}

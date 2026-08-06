"use client"

import { useQuery } from "@tanstack/react-query"

import { useInvalidatingMutation } from "@/hooks/use-invalidating-mutation"
import { createTask, deleteTask, listTasks, updateTask } from "@/services/tasks"
import type { Task, TaskInput, TaskUpdateInput } from "@/types"

const TASKS_KEY = ["tasks"] as const

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: listTasks,
  })
}

export function useCreateTask() {
  return useInvalidatingMutation<TaskInput, Task>(TASKS_KEY, (input) =>
    createTask(input),
  )
}

export function useUpdateTask() {
  return useInvalidatingMutation<
    { id: string; input: TaskUpdateInput },
    Task
  >(TASKS_KEY, ({ id, input }) => updateTask(id, input))
}

export function useDeleteTask() {
  return useInvalidatingMutation<string, { message: string }>(TASKS_KEY, (id) =>
    deleteTask(id),
  )
}

"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { useInvalidatingMutation } from "@/hooks/use-invalidating-mutation"
import { getChatSocket } from "@/lib/socket"
import { createTask, deleteTask, listTasks, updateTask } from "@/services/tasks"
import { useAuthStore } from "@/stores/auth"
import type { Task, TaskInput, TaskUpdateInput } from "@/types"

const TASKS_KEY = ["tasks"] as const

export function useTaskRealtime(): void {
  const token = useAuthStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const socket = getChatSocket(token)
    const refresh = () => queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    socket.on("task:created", refresh)
    socket.on("task:updated", refresh)
    socket.on("task:deleted", refresh)
    return () => {
      socket.off("task:created", refresh)
      socket.off("task:updated", refresh)
      socket.off("task:deleted", refresh)
    }
  }, [token, queryClient])
}

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

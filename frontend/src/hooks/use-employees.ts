"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  updateSchedule,
} from "@/services/employees"
import type {
  EmployeeInput,
  EmployeeUpdateInput,
  WorkScheduleEntry,
} from "@/types"

const EMPLOYEES_KEY = ["employees"] as const

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: listEmployees,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EmployeeInput) => createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EmployeeUpdateInput }) =>
      updateEmployee(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      entries,
    }: {
      id: string
      entries: WorkScheduleEntry[]
    }) => updateSchedule(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}

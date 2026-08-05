"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  resendInvite,
  updateEmployee,
  updateSchedule,
} from "@/services/employees"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
} from "@/types"

const EMPLOYEES_KEY = ["employees"] as const

function useInvalidatingMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY })
    },
  })
}

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: listEmployees,
  })
}

export function useCreateEmployee() {
  return useInvalidatingMutation<EmployeeInput, Employee>((input) =>
    createEmployee(input),
  )
}

export function useUpdateEmployee() {
  return useInvalidatingMutation<
    { id: string; input: EmployeeUpdateInput },
    Employee
  >(({ id, input }) => updateEmployee(id, input))
}

export function useDeleteEmployee() {
  return useInvalidatingMutation<string, { message: string }>((id) =>
    deleteEmployee(id),
  )
}

export function useUpdateSchedule() {
  return useInvalidatingMutation<
    { id: string; entries: WorkScheduleEntry[] },
    WorkSchedule
  >(({ id, entries }) => updateSchedule(id, entries))
}

export function useResendInvite() {
  return useInvalidatingMutation<string, { message: string; devLink?: string }>(
    (id) => resendInvite(id),
  )
}

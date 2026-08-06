"use client"

import { useQuery } from "@tanstack/react-query"

import { useInvalidatingMutation } from "@/hooks/use-invalidating-mutation"
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

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: listEmployees,
  })
}

export function useCreateEmployee() {
  return useInvalidatingMutation<EmployeeInput, Employee>(
    EMPLOYEES_KEY,
    (input) => createEmployee(input),
  )
}

export function useUpdateEmployee() {
  return useInvalidatingMutation<
    { id: string; input: EmployeeUpdateInput },
    Employee
  >(EMPLOYEES_KEY, ({ id, input }) => updateEmployee(id, input))
}

export function useDeleteEmployee() {
  return useInvalidatingMutation<string, { message: string }>(
    EMPLOYEES_KEY,
    (id) => deleteEmployee(id),
  )
}

export function useUpdateSchedule() {
  return useInvalidatingMutation<
    { id: string; entries: WorkScheduleEntry[] },
    WorkSchedule
  >(EMPLOYEES_KEY, ({ id, entries }) => updateSchedule(id, entries))
}

export function useResendInvite() {
  return useInvalidatingMutation<string, { message: string; devLink?: string }>(
    EMPLOYEES_KEY,
    (id) => resendInvite(id),
  )
}

import { api } from "@/lib/api"
import { API_ENDPOINTS, USE_MOCK } from "@/lib/constants"
import {
  mockCreateEmployee,
  mockDeleteEmployee,
  mockGetSchedule,
  mockListEmployees,
  mockUpdateEmployee,
  mockUpdateSchedule,
} from "@/lib/mock/employees"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
} from "@/types"

export async function listEmployees(): Promise<Employee[]> {
  if (USE_MOCK) return mockListEmployees()
  return api.get<Employee[]>(API_ENDPOINTS.employees)
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  if (USE_MOCK) return mockCreateEmployee(input)
  return api.post<Employee>(API_ENDPOINTS.employees, input)
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  if (USE_MOCK) return mockUpdateEmployee(id, input)
  return api.patch<Employee>(API_ENDPOINTS.employee(id), input)
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockDeleteEmployee(id)
  return api.delete<{ message: string }>(API_ENDPOINTS.employee(id))
}

export async function getSchedule(id: string): Promise<WorkSchedule> {
  if (USE_MOCK) return mockGetSchedule(id)
  return api.get<WorkSchedule>(API_ENDPOINTS.employeeSchedule(id))
}

export async function updateSchedule(
  id: string,
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  if (USE_MOCK) return mockUpdateSchedule(id, entries)
  return api.put<WorkSchedule>(API_ENDPOINTS.employeeSchedule(id), { entries })
}

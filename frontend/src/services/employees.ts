import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
} from "@/types"

export async function listEmployees(): Promise<Employee[]> {
  return api.get<Employee[]>(API_ENDPOINTS.employees)
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  return api.post<Employee>(API_ENDPOINTS.employees, input)
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  return api.patch<Employee>(API_ENDPOINTS.employee(id), input)
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(API_ENDPOINTS.employee(id))
}

export async function updateSchedule(
  id: string,
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  return api.put<WorkSchedule>(API_ENDPOINTS.employeeSchedule(id), { entries })
}

export async function resendInvite(
  id: string,
): Promise<{ message: string; devLink?: string }> {
  return api.post<{ message: string; devLink?: string }>(
    API_ENDPOINTS.employee(id),
    { action: "resend-invite" },
  )
}

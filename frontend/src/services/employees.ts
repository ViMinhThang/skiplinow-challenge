import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import {
  employeeSchema,
  messageResponseSchema,
  resendInviteResultSchema,
  workScheduleSchema,
} from "@/lib/schemas"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
} from "@/types"

export async function listEmployees(): Promise<Employee[]> {
  return api.get(API_ENDPOINTS.employees, { schema: employeeSchema.array() })
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  return api.post(API_ENDPOINTS.createEmployee, input, { schema: employeeSchema })
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  return api.patch(API_ENDPOINTS.employee(id), input, { schema: employeeSchema })
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  return api.delete(API_ENDPOINTS.employee(id), { schema: messageResponseSchema })
}

export async function updateSchedule(
  id: string,
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  return api.put(API_ENDPOINTS.employeeSchedule(id), { entries }, {
    schema: workScheduleSchema,
  })
}

export async function resendInvite(
  id: string,
): Promise<{ message: string; devLink?: string }> {
  return api.post(API_ENDPOINTS.employee(id), { action: "resend-invite" }, {
    schema: resendInviteResultSchema,
  })
}

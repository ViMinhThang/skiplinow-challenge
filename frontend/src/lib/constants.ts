export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000"

export const STORAGE_KEYS = {
  auth: "Tasked.auth",
  phone: "Tasked.phone",
} as const

export const API_ENDPOINTS = {
  requestAccessCode: "/auth/create-new-access-code",
  verifyAccessCode: "/auth/validate-access-code",
  login: "/auth/login",
  setupAccount: "/auth/setup",
  me: "/auth/me",
  employees: "/employees",
  createEmployee: "/employees/create-employee",
  getEmployee: "/employees/get-employee",
  deleteEmployee: "/employees/delete-employee",
  employee: (id: string) => `/employees/${id}`,
  employeeSchedule: (id: string) => `/employees/${id}/schedule`,
  tasks: "/tasks",
  task: (id: string) => `/tasks/${id}`,
  conversations: "/conversations",
  messages: "/messages",
} as const

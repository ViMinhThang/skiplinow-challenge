export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

/** When true (default), all API calls are served by the in-browser mock. */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"

export const STORAGE_KEYS = {
  auth: "taskflow.auth",
  phone: "taskflow.phone",
} as const

export const API_ENDPOINTS = {
  requestAccessCode: "/auth/request-code",
  verifyAccessCode: "/auth/verify-code",
  login: "/auth/login",
  setupAccount: "/auth/setup",
  me: "/auth/me",
  employees: "/employees",
  employee: (id: string) => `/employees/${id}`,
  employeeSchedule: (id: string) => `/employees/${id}/schedule`,
  tasks: "/tasks",
  task: (id: string) => `/tasks/${id}`,
  conversations: "/conversations",
  messages: "/messages",
} as const

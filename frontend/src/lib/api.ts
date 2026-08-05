import { API_URL } from "@/lib/constants"
import type { AuthSession } from "@/types"

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

const AUTH_STORAGE_KEY = "taskflow.auth"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as {
      state?: { session?: AuthSession }
      session?: AuthSession
    }
    return data.state?.session?.token ?? data.session?.token ?? null
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      (body && typeof body === "object" && "message" in body && body.message
        ? String(body.message)
        : null) ?? `Request failed with status ${response.status}`
    throw new ApiError(response.status, message, body)
  }

  const body = await response.json().catch(() => null)

  return body as T
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: "DELETE" }),
}

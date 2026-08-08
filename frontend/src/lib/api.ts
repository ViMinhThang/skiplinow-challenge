import axios, { AxiosError, type AxiosRequestConfig } from "axios"

import { API_URL } from "@/lib/constants"
import { persistedSessionSchema } from "@/lib/schemas"

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
    const parsed = persistedSessionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    return parsed.data.state?.session?.token ?? parsed.data.session?.token ?? null
  } catch {
    return null
  }
}

interface ParsedResponseSchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | {
        success: false
        error: { issues: ReadonlyArray<{ message: string }> }
      }
}

export interface ApiOptions<T> {
  schema?: ParsedResponseSchema<T>
  signal?: AbortSignal
  headers?: Record<string, string>
}

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  options?: ApiOptions<T>,
): Promise<T> {
  const { schema, signal, headers } = options ?? {}

  const axiosConfig: AxiosRequestConfig = {
    method,
    url: path,
    data: body,
    headers,
    signal,
  }

  try {
    const response = await client.request<unknown>(axiosConfig)

    if (schema) {
      const parsed = schema.safeParse(response.data)
      if (!parsed.success) {
        throw new ApiError(
          502,
          "The server returned an unexpected response.",
          parsed.error,
        )
      }
      return parsed.data
    }

    return response.data as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError<{ message?: string }>
      const status = error.response?.status ?? 0
      const details = error.response?.data
      const message =
        details?.message ??
        error.message ??
        `Request failed with status ${status}`
      throw new ApiError(status, message, details)
    }
    throw err
  }
}

export const api = {
  get: <T>(path: string, options?: ApiOptions<T>) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiOptions<T>) =>
    request<T>("POST", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions<T>) =>
    request<T>("PATCH", path, body, options),
  put: <T>(path: string, body?: unknown, options?: ApiOptions<T>) =>
    request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: ApiOptions<T>) =>
    request<T>("DELETE", path, undefined, options),
}

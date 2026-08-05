import { ApiError } from "@/lib/api"

export function getErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong."
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

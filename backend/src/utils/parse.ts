import type { ZodType } from "zod"

import { HttpError } from "../errors/http-error.js"

export function parseBody<T>(body: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ?? "Invalid request.",
    )
  }
  return result.data
}

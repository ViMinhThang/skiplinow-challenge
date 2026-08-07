export function readString(body: unknown, key: string): string {
  const value = readValue(body, key)
  return typeof value === "string" ? value.trim() : ""
}

export function readArray(body: unknown, key: string): unknown[] {
  const value = readValue(body, key)
  return Array.isArray(value) ? value : []
}

function readValue(body: unknown, key: string): unknown {
  if (!body || typeof body !== "object" || !(key in body)) return undefined
  return (body as Record<string, unknown>)[key]
}

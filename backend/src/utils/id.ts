export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

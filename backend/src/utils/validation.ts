const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isPhone(value: string): boolean {
  return /^\d{7,15}$/.test(value.replace(/\D/g, ""))
}

export function isTime(value: string): boolean {
  return TIME_PATTERN.test(value)
}

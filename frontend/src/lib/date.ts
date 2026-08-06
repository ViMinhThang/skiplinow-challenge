const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

function parseDate(value: string): Date {
  return new Date(value.endsWith("Z") ? value : `${value}T00:00:00`)
}

/** Formats a `YYYY-MM-DD` string as e.g. "Aug 5". */
export function formatMonthDay(dateString: string): string {
  const date = parseDate(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

/** Formats an ISO timestamp as e.g. "Aug 5, 2026". */
export function formatShortDate(isoString: string): string {
  const date = parseDate(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** Formats an ISO timestamp as a 12-hour clock time, e.g. "9:05 AM". */
export function formatClockTime(isoString: string): string {
  const date = parseDate(isoString)
  if (Number.isNaN(date.getTime())) return isoString
  const hours = date.getHours()
  const suffix = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`
}

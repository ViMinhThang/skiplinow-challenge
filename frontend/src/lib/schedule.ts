import type { WorkSchedule, WorkScheduleDay } from "@/types"

export const WEEK_DAYS: WorkScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export const DAY_SHORT: Record<WorkScheduleDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

export const DAY_LONG: Record<WorkScheduleDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export function scheduleSummary(schedule: WorkSchedule): string {
  const active = schedule.entries.filter((entry) => entry.enabled)
  if (active.length === 0) return "Not set"
  const labels = active.map((entry) => DAY_SHORT[entry.day])
  if (labels.length > 3) {
    return `${labels.slice(0, 3).join(" · ")} +${labels.length - 3}`
  }
  return labels.join(" · ")
}

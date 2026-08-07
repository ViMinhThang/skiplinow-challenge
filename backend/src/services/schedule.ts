export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type WorkScheduleDay = (typeof WEEK_DAYS)[number]

export interface WorkScheduleEntry {
  day: WorkScheduleDay
  start: string
  end: string
  enabled: boolean
}

export interface WorkSchedule {
  entries: WorkScheduleEntry[]
}

export function isWorkScheduleDay(value: string): value is WorkScheduleDay {
  return (WEEK_DAYS as readonly string[]).includes(value)
}

export function defaultSchedule(): WorkSchedule {
  return {
    entries: WEEK_DAYS.map((day) => ({
      day,
      start: "09:00",
      end: "17:00",
      enabled: false,
    })),
  }
}

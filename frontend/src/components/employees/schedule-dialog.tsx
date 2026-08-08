"use client"

import { useState } from "react"
import { CalendarDaysIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/format"
import { formMessage, scheduleFormSchema } from "@/lib/schemas"
import { DAY_LONG, WEEK_DAYS } from "@/lib/schedule"
import { useUpdateSchedule } from "@/hooks/use-employees"
import type { Employee, WorkScheduleDay, WorkScheduleEntry } from "@/types"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

function ScheduleFields({ employee }: { employee: Employee }) {
  const [entries, setEntries] = useState<WorkScheduleEntry[]>(
    () =>
      WEEK_DAYS.map((day) => {
        const existing = employee.schedule.entries.find(
          (entry) => entry.day === day,
        )
        return existing ?? { day, start: "09:00", end: "17:00", enabled: false }
      }),
  )
  const [error, setError] = useState<string | null>(null)
  const scheduleMutation = useUpdateSchedule()
  const loading = scheduleMutation.isPending

  function updateEntry(
    day: WorkScheduleDay,
    patch: Partial<WorkScheduleEntry>,
  ) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.day === day ? { ...entry, ...patch } : entry,
      ),
    )
  }

  async function handleSave() {
    setError(null)
    const validationError = formMessage(scheduleFormSchema.safeParse({ entries }))
    if (validationError) {
      setError(validationError)
      return
    }
    try {
      await scheduleMutation.mutateAsync({
        id: employee.id,
        entries,
      })
      toast.success("Work schedule saved.")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div
            key={entry.day}
            className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5"
          >
            <input
              type="checkbox"
              id={`day-${entry.day}`}
              checked={entry.enabled}
              onChange={(event) =>
                updateEntry(entry.day, { enabled: event.target.checked })
              }
              className="size-4 shrink-0 accent-primary"
            />
            <Label
              htmlFor={`day-${entry.day}`}
              className="w-24 shrink-0 cursor-pointer font-medium"
            >
              {DAY_LONG[entry.day]}
            </Label>
            <div className="flex flex-1 items-center gap-2">
              <Input
                type="time"
                value={entry.start}
                disabled={!entry.enabled}
                aria-label={`${DAY_LONG[entry.day]} start time`}
                onChange={(event) =>
                  updateEntry(entry.day, { start: event.target.value })
                }
                className="h-8"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                value={entry.end}
                disabled={!entry.enabled}
                aria-label={`${DAY_LONG[entry.day]} end time`}
                onChange={(event) =>
                  updateEntry(entry.day, { end: event.target.value })
                }
                className="h-8"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CalendarDaysIcon />
          )}
          Save schedule
        </Button>
      </DialogFooter>
    </div>
  )
}

export function ScheduleDialog({
  open,
  onOpenChange,
  employee,
}: ScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Work schedule — {employee?.name}
          </DialogTitle>
          <DialogDescription>
            Set the days and working hours for this employee.
          </DialogDescription>
        </DialogHeader>
        {open && employee && <ScheduleFields employee={employee} />}
      </DialogContent>
    </Dialog>
  )
}

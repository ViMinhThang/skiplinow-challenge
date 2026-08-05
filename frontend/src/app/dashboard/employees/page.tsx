"use client"

import { useState } from "react"
import {
  CalendarDaysIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { DeleteEmployeeDialog } from "@/components/employees/delete-employee-dialog"
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog"
import { ScheduleDialog } from "@/components/employees/schedule-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployees } from "@/hooks/use-employees"
import { getErrorMessage, initials } from "@/lib/format"
import type { Employee, WorkSchedule, WorkScheduleDay } from "@/types"

const DAY_SHORT: Record<WorkScheduleDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

function scheduleSummary(schedule: WorkSchedule): string {
  const active = schedule.entries.filter((entry) => entry.enabled)
  if (active.length === 0) return "Not set"
  const labels = active.map((entry) => DAY_SHORT[entry.day])
  if (labels.length > 3) return `${labels.slice(0, 3).join(" · ")} +${labels.length - 3}`
  return labels.join(" · ")
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-7 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function EmployeesPage() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees()
  const [formOpen, setFormOpen] = useState(false)
  const [formEmployee, setFormEmployee] = useState<Employee | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null)

  function openCreate() {
    setFormEmployee(null)
    setFormOpen(true)
  }

  function openEdit(employee: Employee) {
    setFormEmployee(employee)
    setFormOpen(true)
  }

  function openDelete(employee: Employee) {
    setDeleteEmployee(employee)
    setDeleteOpen(true)
  }

  function openSchedule(employee: Employee) {
    setScheduleEmployee(employee)
    setScheduleOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team, their profiles, and work schedules.
          </p>
        </div>
        <Button onClick={openCreate}>
          <UserPlusIcon />
          Add employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
          <CardDescription>
            {employees?.length ?? 0} employee(s) on the roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <LoadingRows />}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <p className="text-sm text-destructive">
                        {getErrorMessage(error)}
                      </p>
                      <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCwIcon />
                        Try again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && employees?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <UsersIcon className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No employees yet. Add your first team member.
                      </p>
                      <Button variant="outline" onClick={openCreate}>
                        <UserPlusIcon />
                        Add employee
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                employees?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.phone}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {employee.accountSetup ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {scheduleSummary(employee.schedule)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(employee)}
                          aria-label={`Edit ${employee.name}`}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openSchedule(employee)}
                          aria-label={`Set schedule for ${employee.name}`}
                        >
                          <CalendarDaysIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(employee)}
                          aria-label={`Delete ${employee.name}`}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={formEmployee}
      />
      <DeleteEmployeeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        employee={deleteEmployee}
      />
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        employee={scheduleEmployee}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { DeleteEmployeeDialog } from "@/components/employees/delete-employee-dialog"
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog"
import { EmployeesTable } from "@/components/employees/employees-table"
import { ScheduleDialog } from "@/components/employees/schedule-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  useEmployees,
  useResendInvite,
} from "@/hooks/use-employees"
import { getErrorMessage } from "@/lib/format"
import type { Employee } from "@/types"

export default function EmployeesPage() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees()
  const resendInviteMutation = useResendInvite()
  const [formOpen, setFormOpen] = useState(false)
  const [formEmployee, setFormEmployee] = useState<Employee | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

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

  async function handleResendInvite(employee: Employee) {
    setResendingId(employee.id)
    try {
      const result = await resendInviteMutation.mutateAsync(employee.id)
      toast.success(result.message)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResendingId(null)
    }
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
          <EmployeesTable
            employees={employees}
            isLoading={isLoading}
            isError={isError}
            error={error}
            resendingId={resendingId}
            onRetry={() => refetch()}
            onAdd={openCreate}
            onEdit={openEdit}
            onSchedule={openSchedule}
            onDelete={openDelete}
            onResendInvite={handleResendInvite}
          />
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

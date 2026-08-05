"use client"

import {
  CalendarDaysIcon,
  MailIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage, initials } from "@/lib/format"
import { scheduleSummary } from "@/lib/schedule"
import type { Employee } from "@/types"

const TABLE_COLUMNS = 6

interface EmployeesTableProps {
  employees?: Employee[]
  isLoading: boolean
  isError: boolean
  error: unknown
  resendingId: string | null
  onRetry: () => void
  onAdd: () => void
  onEdit: (employee: Employee) => void
  onSchedule: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onResendInvite: (employee: Employee) => void
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

function ErrorRow({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <TableRow>
      <TableCell colSpan={TABLE_COLUMNS}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-destructive">{message}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCwIcon />
            Try again
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyRow({ onAdd }: { onAdd: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={TABLE_COLUMNS}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No employees yet. Add your first team member.
          </p>
          <Button variant="outline" onClick={onAdd}>
            <UserPlusIcon />
            Add employee
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmployeeRow({
  employee,
  resending,
  onEdit,
  onSchedule,
  onDelete,
  onResendInvite,
}: {
  employee: Employee
  resending: boolean
  onEdit: () => void
  onSchedule: () => void
  onDelete: () => void
  onResendInvite: () => void
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {initials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{employee.name}</p>
            <p className="text-xs text-muted-foreground">{employee.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{employee.phone}</TableCell>
      <TableCell>
        <Badge variant="outline">{employee.role}</Badge>
      </TableCell>
      <TableCell>
        {employee.accountSetup ? (
          <Badge className="bg-success/10 text-success">Active</Badge>
        ) : (
          <Badge className="bg-warning/10 text-warning">Pending</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {scheduleSummary(employee.schedule)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {!employee.accountSetup && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onResendInvite}
              disabled={resending}
              aria-label={`Resend invite to ${employee.name}`}
            >
              <MailIcon />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${employee.name}`}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSchedule}
            aria-label={`Set schedule for ${employee.name}`}
          >
            <CalendarDaysIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${employee.name}`}
          >
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function EmployeesTable({
  employees,
  isLoading,
  isError,
  error,
  resendingId,
  onRetry,
  onAdd,
  onEdit,
  onSchedule,
  onDelete,
  onResendInvite,
}: EmployeesTableProps) {
  return (
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
          <ErrorRow message={getErrorMessage(error)} onRetry={onRetry} />
        )}

        {!isLoading && !isError && employees?.length === 0 && (
          <EmptyRow onAdd={onAdd} />
        )}

        {!isLoading &&
          !isError &&
          employees?.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              resending={resendingId === employee.id}
              onEdit={() => onEdit(employee)}
              onSchedule={() => onSchedule(employee)}
              onDelete={() => onDelete(employee)}
              onResendInvite={() => onResendInvite(employee)}
            />
          ))}
      </TableBody>
    </Table>
  )
}

import { ApiError } from "@/lib/api"
import { delay, getDatabase, persistDatabase } from "@/lib/mock/db"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
  WorkScheduleDay,
} from "@/types"

const DAYS: WorkScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export function defaultSchedule(): WorkSchedule {
  return {
    entries: DAYS.map((day) => ({
      day,
      start: "09:00",
      end: "17:00",
      enabled: false,
    })),
  }
}

function toEmployee(
  db: ReturnType<typeof getDatabase>,
  id: string,
): Employee {
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(404, "Employee not found.")
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? "",
    role: user.jobTitle ?? "Staff",
    accountSetup: Boolean(user.accountSetup),
    schedule: user.schedule ?? defaultSchedule(),
    createdAt: "",
  }
}

export async function mockListEmployees(): Promise<Employee[]> {
  await delay(250)
  const db = getDatabase()
  return db.users
    .filter((user) => user.role === "employee")
    .map((user) => toEmployee(db, user.id))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function mockCreateEmployee(
  input: EmployeeInput,
): Promise<Employee> {
  await delay()
  const db = getDatabase()

  const email = input.email.trim().toLowerCase()
  if (
    db.users.some((user) => user.email?.toLowerCase() === email)
  ) {
    throw new ApiError(409, "An employee with this email already exists.")
  }

  const id = `emp-${Date.now().toString(36)}`
  db.users.push({
    id,
    role: "employee",
    name: input.name.trim(),
    phone: input.phone.trim(),
    email,
    jobTitle: input.role.trim(),
    accountSetup: false,
  })
  persistDatabase(db)

  // Mock "invite email": the real backend sends a setup link to this address.
  const token = `invite-${id}-${Math.random().toString(36).slice(2, 10)}`
  console.info(
    `[mock-email] Invite sent to ${email}: set up your account at http://localhost:3000/setup?token=${token}`,
  )

  return toEmployee(db, id)
}

export async function mockUpdateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  await delay()
  const db = getDatabase()
  const user = db.users.find((u) => u.id === id)
  if (!user || user.role !== "employee") {
    throw new ApiError(404, "Employee not found.")
  }

  const email = input.email?.trim().toLowerCase()
  if (
    email &&
    db.users.some(
      (u) => u.id !== id && u.email?.toLowerCase() === email,
    )
  ) {
    throw new ApiError(409, "An employee with this email already exists.")
  }

  if (input.name) user.name = input.name.trim()
  if (input.phone) user.phone = input.phone.trim()
  if (email) user.email = email
  if (input.role) user.jobTitle = input.role.trim()
  persistDatabase(db)

  return toEmployee(db, id)
}

export async function mockDeleteEmployee(
  id: string,
): Promise<{ message: string }> {
  await delay()
  const db = getDatabase()
  const index = db.users.findIndex((u) => u.id === id)
  if (index === -1 || db.users[index].role !== "employee") {
    throw new ApiError(404, "Employee not found.")
  }
  db.users.splice(index, 1)
  persistDatabase(db)
  return { message: "Employee removed." }
}

export async function mockGetSchedule(
  id: string,
): Promise<WorkSchedule> {
  await delay(200)
  const db = getDatabase()
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(404, "Employee not found.")
  return user.schedule ?? defaultSchedule()
}

export async function mockUpdateSchedule(
  id: string,
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  await delay()
  const db = getDatabase()
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(404, "Employee not found.")
  user.schedule = { entries }
  persistDatabase(db)
  return user.schedule
}

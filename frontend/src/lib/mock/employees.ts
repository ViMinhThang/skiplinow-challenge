import { ApiError } from "@/lib/api"
import {
  createInvite,
  delay,
  findEmployeeById,
  getDatabase,
  persistDatabase,
} from "@/lib/mock/db"
import { defaultSchedule } from "@/lib/schedule"
import type {
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  WorkSchedule,
  WorkScheduleEntry,
} from "@/types"
import type { MockUser } from "@/lib/mock/db"

function toEmployee(user: MockUser): Employee {
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

function assertEmailAvailable(
  db: ReturnType<typeof getDatabase>,
  email: string,
  exceptId?: string,
): void {
  const duplicate = db.users.some(
    (user) =>
      user.id !== exceptId && user.email?.toLowerCase() === email,
  )
  if (duplicate) {
    throw new ApiError(409, "An employee with this email already exists.")
  }
}

function requireEmployee(
  db: ReturnType<typeof getDatabase>,
  id: string,
): MockUser {
  const user = findEmployeeById(db, id)
  if (!user) throw new ApiError(404, "Employee not found.")
  return user
}

export async function mockListEmployees(): Promise<Employee[]> {
  await delay(250)
  const db = getDatabase()
  const employees: Employee[] = []
  for (const user of db.users) {
    if (user.role !== "employee") continue
    employees.push(toEmployee(user))
  }
  return employees.sort((a, b) => a.name.localeCompare(b.name))
}

export async function mockCreateEmployee(
  input: EmployeeInput,
): Promise<Employee> {
  await delay()
  const db = getDatabase()

  const email = input.email.trim().toLowerCase()
  assertEmailAvailable(db, email)

  const id = `emp-${Date.now().toString(36)}`
  const user: MockUser = {
    id,
    role: "employee",
    name: input.name.trim(),
    phone: input.phone.trim(),
    email,
    jobTitle: input.role.trim(),
    accountSetup: false,
  }
  db.users.push(user)
  persistDatabase(db)

  // Mock "invite email": the real backend sends a setup link to this address.
  const token = createInvite(db, id)
  console.info(
    `[mock-email] Invite sent to ${email}: set up your account at http://localhost:3000/setup?token=${token}`,
  )

  return toEmployee(user)
}

export async function mockResendInvite(
  id: string,
): Promise<{ message: string; devLink: string }> {
  await delay()
  const db = getDatabase()
  const user = requireEmployee(db, id)
  if (user.accountSetup) {
    throw new ApiError(409, "This employee has already set up their account.")
  }

  const token = createInvite(db, id)
  persistDatabase(db)
  const devLink = `http://localhost:3000/setup?token=${token}`
  console.info(
    `[mock-email] Invite re-sent to ${user.email}: ${devLink}`,
  )
  return {
    message: `Invite email re-sent to ${user.email}.`,
    devLink,
  }
}

export async function mockUpdateEmployee(
  id: string,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  await delay()
  const db = getDatabase()
  const user = requireEmployee(db, id)

  const email = input.email?.trim().toLowerCase()
  if (email) assertEmailAvailable(db, email, id)

  if (input.name) user.name = input.name.trim()
  if (input.phone) user.phone = input.phone.trim()
  if (email) user.email = email
  if (input.role) user.jobTitle = input.role.trim()
  persistDatabase(db)

  return toEmployee(user)
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

export async function mockUpdateSchedule(
  id: string,
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  await delay()
  const db = getDatabase()
  const user = requireEmployee(db, id)
  user.schedule = { entries }
  persistDatabase(db)
  return user.schedule
}

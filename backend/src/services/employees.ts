import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"

import { getAdapter } from "../db.js"
import { HttpError } from "../app.js"
import { sendInviteEmail } from "./email.js"
import { defaultSchedule, isEmail, isPhone, type WorkSchedule } from "./schedule.js"
import { normalizeKey } from "./access-codes.js"

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const EMPLOYEES_COLLECTION = "employees"

export interface EmployeeRecord {
  id: string
  name: string
  phone: string
  phoneNormalized: string
  email: string
  role: string
  accountSetup: boolean
  schedule: WorkSchedule
  username?: string
  passwordHash?: string
  inviteTokenHash?: string
  inviteExpiresAt?: number
  createdAt: string
  updatedAt: string
}

export interface EmployeeView {
  id: string
  name: string
  phone: string
  email: string
  role: string
  accountSetup: boolean
  schedule: WorkSchedule
  createdAt: string
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

function toEmployee(record: EmployeeRecord): EmployeeView {
  return {
    id: record.id,
    name: String(record.name ?? ""),
    phone: String(record.phone ?? ""),
    email: String(record.email ?? ""),
    role: String(record.role ?? ""),
    accountSetup: Boolean(record.accountSetup),
    schedule: record.schedule as WorkSchedule,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
  }
}

function toId(): string {
  return `emp-${Date.now().toString(36)}`
}

async function findRecord(id: string): Promise<EmployeeRecord | null> {
  const db = getAdapter()
  const record = await db.get(EMPLOYEES_COLLECTION, id)
  if (!record) return null
  return {
    id: record.id,
    name: String(record.name ?? ""),
    phone: String(record.phone ?? ""),
    phoneNormalized: String(record.phoneNormalized ?? ""),
    email: String(record.email ?? ""),
    role: String(record.role ?? ""),
    accountSetup: Boolean(record.accountSetup),
    schedule: (record.schedule as WorkSchedule) ?? defaultSchedule(),
    username: record.username ? String(record.username) : undefined,
    passwordHash: record.passwordHash ? String(record.passwordHash) : undefined,
    inviteTokenHash: record.inviteTokenHash ? String(record.inviteTokenHash) : undefined,
    inviteExpiresAt: record.inviteExpiresAt ? Number(record.inviteExpiresAt) : undefined,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
  }
}

async function listRecords(): Promise<EmployeeRecord[]> {
  const db = getAdapter()
  const records = await db.list(EMPLOYEES_COLLECTION)
  return records
    .map((record) => ({
      id: record.id,
      name: String(record.name ?? ""),
      phone: String(record.phone ?? ""),
      phoneNormalized: String(record.phoneNormalized ?? ""),
      email: String(record.email ?? ""),
      role: String(record.role ?? ""),
      accountSetup: Boolean(record.accountSetup),
      schedule: (record.schedule as WorkSchedule) ?? defaultSchedule(),
      username: record.username ? String(record.username) : undefined,
      passwordHash: record.passwordHash ? String(record.passwordHash) : undefined,
      inviteTokenHash: record.inviteTokenHash ? String(record.inviteTokenHash) : undefined,
      inviteExpiresAt: record.inviteExpiresAt ? Number(record.inviteExpiresAt) : undefined,
      createdAt: String(record.createdAt ?? new Date().toISOString()),
      updatedAt: String(record.updatedAt ?? new Date().toISOString()),
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function assertUnique(
  email: string,
  phone: string,
  excludeId?: string,
): Promise<void> {
  const records = await listRecords()
  const emailKey = email.toLowerCase()
  const phoneKey = normalizeKey(phone)
  for (const record of records) {
    if (record.id === excludeId) continue
    if (record.email.toLowerCase() === emailKey) {
      throw new HttpError(409, "An employee with this email already exists.")
    }
    if (record.phoneNormalized === phoneKey) {
      throw new HttpError(409, "An employee with this phone number already exists.")
    }
  }
}

export async function listEmployees(): Promise<EmployeeView[]> {
  const records = await listRecords()
  return records.map(toEmployee)
}

export async function getEmployee(id: string): Promise<EmployeeView> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")
  return toEmployee(record)
}

export async function getEmployeeRecord(id: string): Promise<EmployeeRecord | null> {
  return findRecord(id)
}

export async function createEmployee(input: {
  name: string
  phone: string
  email: string
  role: string
}): Promise<EmployeeView & { success: true; employeeId: string }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const role = input.role.trim()

  if (!name) throw new HttpError(400, "Name is required.")
  if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.")
  if (!isPhone(phone)) throw new HttpError(400, "Phone number must contain 7–15 digits.")
  if (!role) throw new HttpError(400, "Role is required.")

  await assertUnique(email, phone)

  const db = getAdapter()
  const id = toId()
  const now = new Date().toISOString()
  const inviteToken = randomBytes(24).toString("hex")
  const inviteTokenHash = await bcrypt.hash(inviteToken, 10)

  const record: EmployeeRecord = {
    id,
    name,
    phone,
    phoneNormalized: normalizeKey(phone),
    email,
    role,
    accountSetup: false,
    schedule: defaultSchedule(),
    inviteTokenHash,
    inviteExpiresAt: Date.now() + INVITE_TTL_MS,
    createdAt: now,
    updatedAt: now,
  }
  await db.set(EMPLOYEES_COLLECTION, id, { ...record })

  const emailResult = await sendInviteEmail(email, name, inviteToken)
  return {
    ...toEmployee(record),
    success: true,
    employeeId: id,
    ...(emailResult.devLink ? { devLink: emailResult.devLink } : {}),
  }
}

export async function updateEmployee(
  id: string,
  patch: { name?: string; phone?: string; email?: string; role?: string },
): Promise<EmployeeView> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")

  const name = patch.name?.trim()
  const email = patch.email?.trim().toLowerCase()
  const phone = patch.phone?.trim()
  const role = patch.role?.trim()

  if (name !== undefined && !name) throw new HttpError(400, "Name is required.")
  if (email !== undefined && !isEmail(email)) throw new HttpError(400, "Please enter a valid email address.")
  if (phone !== undefined && !isPhone(phone)) throw new HttpError(400, "Phone number must contain 7–15 digits.")
  if (role !== undefined && !role) throw new HttpError(400, "Role is required.")

  await assertUnique(email ?? record.email, phone ?? record.phone, id)

  const db = getAdapter()
  const next: EmployeeRecord = {
    ...record,
    name: name ?? record.name,
    email: email ?? record.email,
    phone: phone ?? record.phone,
    phoneNormalized: normalizeKey(phone ?? record.phone),
    role: role ?? record.role,
    updatedAt: new Date().toISOString(),
  }
  await db.set(EMPLOYEES_COLLECTION, id, { ...next })
  return toEmployee(next)
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")
  const db = getAdapter()
  await db.remove(EMPLOYEES_COLLECTION, id)
  return { message: "Employee removed." }
}

export async function updateSchedule(
  id: string,
  entries: WorkSchedule["entries"],
): Promise<WorkSchedule> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")

  if (!Array.isArray(entries) || entries.length !== DAYS.length) {
    throw new HttpError(400, "Schedule must include all 7 days.")
  }

  const seen = new Set<string>()
  for (const entry of entries) {
    if (!(DAYS as readonly string[]).includes(entry.day)) {
      throw new HttpError(400, `Unknown day "${entry.day}".`)
    }
    if (seen.has(entry.day)) {
      throw new HttpError(400, `Duplicate day "${entry.day}".`)
    }
    seen.add(entry.day)
    if (typeof entry.enabled !== "boolean") {
      throw new HttpError(400, "Each day needs an enabled flag.")
    }
    if (entry.enabled) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.end)) {
        throw new HttpError(400, "Work hours must use HH:MM format.")
      }
      if (entry.start >= entry.end) {
        throw new HttpError(400, `Start time must be before end time on ${entry.day}.`)
      }
    }
  }

  const schedule: WorkSchedule = {
    entries: DAYS.map((day) => entries.find((e) => e.day === day) as WorkSchedule["entries"][number]),
  }

  const db = getAdapter()
  await db.update(EMPLOYEES_COLLECTION, id, {
    schedule,
    updatedAt: new Date().toISOString(),
  })
  return schedule
}

export async function resendInvite(
  id: string,
): Promise<{ message: string; devLink?: string }> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")
  if (record.accountSetup) {
    throw new HttpError(400, "This employee has already set up their account.")
  }

  const inviteToken = randomBytes(24).toString("hex")
  const inviteTokenHash = await bcrypt.hash(inviteToken, 10)
  const db = getAdapter()
  await db.update(EMPLOYEES_COLLECTION, id, {
    inviteTokenHash,
    inviteExpiresAt: Date.now() + INVITE_TTL_MS,
    updatedAt: new Date().toISOString(),
  })

  const emailResult = await sendInviteEmail(record.email, record.name, inviteToken)
  return {
    message: `Invite email sent to ${record.email}.`,
    ...(emailResult.devLink ? { devLink: emailResult.devLink } : {}),
  }
}

export async function findByEmail(email: string): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  const key = email.trim().toLowerCase()
  return records.find((r) => r.email.toLowerCase() === key) ?? null
}

export async function findByUsername(username: string): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  return records.find((r) => r.username === username.trim()) ?? null
}

export async function findByInviteToken(token: string): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  for (const record of records) {
    if (!record.inviteTokenHash) continue
    if (await bcrypt.compare(token, record.inviteTokenHash)) return record
  }
  return null
}

export async function setEmployeeCredentials(
  id: string,
  username: string,
  passwordHash: string,
): Promise<void> {
  const db = getAdapter()
  await db.update(EMPLOYEES_COLLECTION, id, {
    username,
    passwordHash,
    accountSetup: true,
    inviteTokenHash: "",
    inviteExpiresAt: 0,
    updatedAt: new Date().toISOString(),
  })
}



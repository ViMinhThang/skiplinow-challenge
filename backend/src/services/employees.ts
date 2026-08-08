import { getAdapter } from "../db.js"
import { HttpError } from "../errors/http-error.js"
import { generateToken, hashValue, verifyValue } from "../utils/crypto.js"
import { generateId } from "../utils/id.js"
import { normalizePhone } from "../utils/phone.js"
import { isEmail, isPhone, isTime } from "../utils/validation.js"
import { sendInviteEmail } from "./email.js"
import {
  WEEK_DAYS,
  defaultSchedule,
  isWorkScheduleDay,
  type WorkSchedule,
  type WorkScheduleDay,
} from "./schedule.js"

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

export interface CreateEmployeeInput {
  name: string
  phone: string
  email: string
  role: string
}

export interface UpdateEmployeeInput {
  name?: string
  phone?: string
  email?: string
  role?: string
}

export interface UpdateOwnProfileInput {
  name?: string
  phone?: string
  email?: string
}

function toEmployee(record: EmployeeRecord): EmployeeView {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    role: record.role,
    accountSetup: record.accountSetup,
    schedule: record.schedule,
    createdAt: record.createdAt,
  }
}

function fromRecord(record: { id: string; [key: string]: unknown }): EmployeeRecord {
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
    inviteTokenHash: record.inviteTokenHash
      ? String(record.inviteTokenHash)
      : undefined,
    inviteExpiresAt: record.inviteExpiresAt
      ? Number(record.inviteExpiresAt)
      : undefined,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
  }
}

async function findRecord(id: string): Promise<EmployeeRecord | null> {
  const db = getAdapter()
  const record = await db.get(EMPLOYEES_COLLECTION, id)
  return record ? fromRecord(record) : null
}

async function listRecords(): Promise<EmployeeRecord[]> {
  const db = getAdapter()
  const records = await db.list(EMPLOYEES_COLLECTION)
  return records
    .map(fromRecord)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function assertUniqueEmailAndPhone(
  email: string,
  phone: string,
  excludeId?: string,
): Promise<void> {
  const records = await listRecords()
  const emailKey = email.toLowerCase()
  const phoneKey = normalizePhone(phone)
  for (const record of records) {
    if (record.id === excludeId) continue
    if (record.email.toLowerCase() === emailKey) {
      throw new HttpError(409, "An employee with this email already exists.")
    }
    if (record.phoneNormalized === phoneKey) {
      throw new HttpError(
        409,
        "An employee with this phone number already exists.",
      )
    }
  }
}

async function issueInvite(): Promise<{
  token: string
  tokenHash: string
  expiresAt: number
}> {
  const token = generateToken()
  return {
    token,
    tokenHash: await hashValue(token),
    expiresAt: Date.now() + INVITE_TTL_MS,
  }
}

function validateScheduleEntries(entries: unknown): WorkSchedule["entries"] {
  if (!Array.isArray(entries) || entries.length !== WEEK_DAYS.length) {
    throw new HttpError(400, "Schedule must include all 7 days.")
  }

  const seen = new Set<WorkScheduleDay>()
  for (const entry of entries) {
    if (!isWorkScheduleDay(String(entry?.day))) {
      throw new HttpError(400, `Unknown day "${String(entry?.day)}".`)
    }
    const day = entry.day
    if (seen.has(day)) {
      throw new HttpError(400, `Duplicate day "${day}".`)
    }
    seen.add(day)

    if (typeof entry.enabled !== "boolean") {
      throw new HttpError(400, "Each day needs an enabled flag.")
    }
    if (!entry.enabled) continue

    if (!isTime(entry.start) || !isTime(entry.end)) {
      throw new HttpError(400, "Work hours must use HH:MM format.")
    }
    if (entry.start >= entry.end) {
      throw new HttpError(400, `Start time must be before end time on ${day}.`)
    }
  }

  return WEEK_DAYS.map(
    (day) => entries.find((entry) => entry.day === day) as WorkSchedule["entries"][number],
  )
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

export async function findEmployeeById(
  id: string,
): Promise<EmployeeRecord | null> {
  return findRecord(id)
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeView & { success: true; employeeId: string }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const role = input.role.trim()

  if (!name) throw new HttpError(400, "Name is required.")
  if (!isEmail(email)) {
    throw new HttpError(400, "Please enter a valid email address.")
  }
  if (!isPhone(phone)) {
    throw new HttpError(400, "Phone number must contain 7–15 digits.")
  }
  if (!role) throw new HttpError(400, "Role is required.")

  await assertUniqueEmailAndPhone(email, phone)

  const db = getAdapter()
  const id = generateId("emp")
  const now = new Date().toISOString()
  const invite = await issueInvite()

  const record: EmployeeRecord = {
    id,
    name,
    phone,
    phoneNormalized: normalizePhone(phone),
    email,
    role,
    accountSetup: false,
    schedule: defaultSchedule(),
    inviteTokenHash: invite.tokenHash,
    inviteExpiresAt: invite.expiresAt,
    createdAt: now,
    updatedAt: now,
  }
  await db.set(EMPLOYEES_COLLECTION, id, { ...record })

  const emailResult = await sendInviteEmail(email, name, invite.token)
  return {
    ...toEmployee(record),
    success: true,
    employeeId: id,
    ...(emailResult.devLink ? { devLink: emailResult.devLink } : {}),
  }
}

async function applyPatch(
  record: EmployeeRecord,
  patch: { name?: string; phone?: string; email?: string; role?: string },
): Promise<EmployeeRecord> {
  const name = patch.name?.trim()
  const email = patch.email?.trim().toLowerCase()
  const phone = patch.phone?.trim()
  const role = patch.role?.trim()

  if (name !== undefined && !name) throw new HttpError(400, "Name is required.")
  if (email !== undefined && !isEmail(email)) {
    throw new HttpError(400, "Please enter a valid email address.")
  }
  if (phone !== undefined && !isPhone(phone)) {
    throw new HttpError(400, "Phone number must contain 7–15 digits.")
  }
  if (role !== undefined && !role) throw new HttpError(400, "Role is required.")

  await assertUniqueEmailAndPhone(email ?? record.email, phone ?? record.phone, record.id)

  const next: EmployeeRecord = {
    ...record,
    name: name ?? record.name,
    email: email ?? record.email,
    phone: phone ?? record.phone,
    phoneNormalized: normalizePhone(phone ?? record.phone),
    role: role ?? record.role,
    updatedAt: new Date().toISOString(),
  }
  const db = getAdapter()
  await db.set(EMPLOYEES_COLLECTION, record.id, { ...next })
  return next
}

export async function updateEmployee(
  id: string,
  patch: UpdateEmployeeInput,
): Promise<EmployeeView> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")
  return toEmployee(await applyPatch(record, patch))
}

export async function updateOwnProfile(
  userId: string,
  patch: UpdateOwnProfileInput,
): Promise<EmployeeRecord> {
  const record = await findRecord(userId)
  if (!record) throw new HttpError(404, "Employee not found.")
  return applyPatch(record, patch)
}

export async function deleteEmployee(
  id: string,
): Promise<{ message: string; success: true }> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")
  const db = getAdapter()
  await db.remove(EMPLOYEES_COLLECTION, id)
  return { message: "Employee removed.", success: true }
}

export async function updateSchedule(
  id: string,
  entries: unknown,
): Promise<WorkSchedule> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")

  const schedule: WorkSchedule = { entries: validateScheduleEntries(entries) }
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

  const invite = await issueInvite()
  const db = getAdapter()
  await db.update(EMPLOYEES_COLLECTION, id, {
    inviteTokenHash: invite.tokenHash,
    inviteExpiresAt: invite.expiresAt,
    updatedAt: new Date().toISOString(),
  })

  const emailResult = await sendInviteEmail(record.email, record.name, invite.token)
  return {
    message: `Invite email sent to ${record.email}.`,
    ...(emailResult.devLink ? { devLink: emailResult.devLink } : {}),
  }
}

export async function findEmployeeByEmail(
  email: string,
): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  const key = email.trim().toLowerCase()
  return records.find((record) => record.email.toLowerCase() === key) ?? null
}

export async function findEmployeeByUsername(
  username: string,
): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  const key = username.trim()
  return records.find((record) => record.username === key) ?? null
}

export async function findEmployeeByInviteToken(
  token: string,
): Promise<EmployeeRecord | null> {
  const records = await listRecords()
  for (const record of records) {
    if (!record.inviteTokenHash) continue
    if (await verifyValue(token, record.inviteTokenHash)) return record
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

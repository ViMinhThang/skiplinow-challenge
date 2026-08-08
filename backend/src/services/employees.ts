import { getAdapter } from "../db.js"
import { HttpError } from "../errors/http-error.js"
import { generateToken, hashValue, verifyValue } from "../utils/crypto.js"
import { generateId } from "../utils/id.js"
import { normalizePhone } from "../utils/phone.js"
import {
  employeeRecordSchema,
  scheduleEntrySchema,
} from "../validation/schemas.js"
import { sendInviteEmail } from "./email.js"
import {
  WEEK_DAYS,
  defaultSchedule,
  type WorkSchedule,
  type WorkScheduleEntry,
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
  email: string
  department: string
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
  return employeeRecordSchema.parse(record)
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
  phone?: string,
  excludeId?: string,
): Promise<void> {
  const records = await listRecords()
  const emailKey = email.toLowerCase()
  const phoneKey = phone ? normalizePhone(phone) : ""
  for (const record of records) {
    if (record.id === excludeId) continue
    if (record.email.toLowerCase() === emailKey) {
      throw new HttpError(409, "An employee with this email already exists.")
    }
    if (phoneKey && record.phoneNormalized === phoneKey) {
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
  const email = input.email.toLowerCase()
  const role = input.department.trim()

  if (!role) throw new HttpError(400, "Department is required.")

  await assertUniqueEmailAndPhone(email)

  const db = getAdapter()
  const id = generateId("emp")
  const now = new Date().toISOString()
  const invite = await issueInvite()

  const record: EmployeeRecord = {
    id,
    name: input.name,
    phone: "",
    phoneNormalized: "",
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

  const emailResult = await sendInviteEmail(email, input.name, invite.token)
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
  const email = patch.email?.toLowerCase()

  await assertUniqueEmailAndPhone(email ?? record.email, patch.phone ?? record.phone, record.id)

  const next: EmployeeRecord = {
    ...record,
    name: patch.name ?? record.name,
    email: email ?? record.email,
    phone: patch.phone ?? record.phone,
    phoneNormalized: normalizePhone(patch.phone ?? record.phone),
    role: patch.role ?? record.role,
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
  entries: WorkScheduleEntry[],
): Promise<WorkSchedule> {
  const record = await findRecord(id)
  if (!record) throw new HttpError(404, "Employee not found.")

  const schedule: WorkSchedule = {
    entries: WEEK_DAYS.map((day) => {
      const entry = entries.find((entry) => entry.day === day)
      if (!entry) {
        throw new HttpError(400, `Missing schedule entry for ${day}.`)
      }
      return scheduleEntrySchema.parse(entry)
    }),
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

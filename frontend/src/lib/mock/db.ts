import { randomAlphanumeric, randomDigits } from "@/lib/random"
import type { UserRole, WorkSchedule } from "@/types"

const DB_KEY = "taskflow.mockdb"

export interface MockUser {
  id: string
  role: UserRole
  name: string
  phone: string
  email?: string
  jobTitle?: string
  username?: string
  password?: string
  accountSetup?: boolean
  schedule?: WorkSchedule
}

export interface MockAccessCode {
  code: string
  expiresAt: number
}

export interface MockInvite {
  employeeId: string
  expiresAt: number
}

export interface MockDatabase {
  users: MockUser[]
  codes: Record<string, MockAccessCode>
  tokens: Record<string, { userId: string }>
  invites: Record<string, MockInvite>
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function createInvite(db: MockDatabase, employeeId: string): string {
  const token = `invite-${employeeId}-${randomAlphanumeric(8)}`
  db.invites[token] = {
    employeeId,
    expiresAt: Date.now() + INVITE_TTL_MS,
  }
  return token
}

/** Fallback for legacy databases that predate stored invites. */
export function findInviteEmployeeId(token: string): string | null {
  const PREFIX = "invite-"
  if (!token.startsWith(PREFIX)) return null
  // Tokens are `invite-<employeeId>-<random>`; employee ids may contain
  // dashes ("emp-1"), so the last dash separates the id from the random part.
  const rest = token.slice(PREFIX.length)
  const separator = rest.lastIndexOf("-")
  if (separator <= 0 || separator === rest.length - 1) return null
  return rest.slice(0, separator)
}

export function seedDatabase(): MockDatabase {
  return {
    users: [
      {
        id: "owner-1",
        role: "owner",
        name: "Alex Owner",
        phone: "5550100",
        email: "owner@taskflow.local",
      },
      {
        id: "emp-1",
        role: "employee",
        name: "Sam Employee",
        phone: "5550101",
        email: "sam@taskflow.local",
        username: "sam",
        password: "secret123",
        accountSetup: true,
        schedule: {
          entries: [
            {
              day: "monday",
              start: "09:00",
              end: "17:00",
              enabled: true,
            },
          ],
        },
      },
      {
        id: "emp-2",
        role: "employee",
        name: "Jordan Lee",
        phone: "5550102",
        email: "jordan@taskflow.local",
        accountSetup: false,
      },
      {
        id: "emp-3",
        role: "employee",
        name: "Priya Patel",
        phone: "5550103",
        email: "priya@taskflow.local",
        accountSetup: false,
      },
    ],
    codes: {},
    tokens: {},
    invites: {},
  }
}

export function getDatabase(): MockDatabase {
  if (typeof window === "undefined") return seedDatabase()
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as MockDatabase
  } catch {
    // ignore corrupted storage
  }
  const db = seedDatabase()
  persistDatabase(db)
  return db
}

export function persistDatabase(db: MockDatabase): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function findByPhone(phone: string): MockUser | undefined {
  const target = normalizePhone(phone)
  return getDatabase().users.find(
    (user) => normalizePhone(user.phone) === target,
  )
}

export function findEmployeeById(
  db: MockDatabase,
  id: string,
): MockUser | undefined {
  const user = db.users.find((u) => u.id === id)
  return user?.role === "employee" ? user : undefined
}

export function generateAccessCode(): string {
  return randomDigits(6)
}

export function delay(ms = 400 + Math.random() * 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

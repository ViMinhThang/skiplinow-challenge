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

export interface MockDatabase {
  users: MockUser[]
  codes: Record<string, MockAccessCode>
  tokens: Record<string, { userId: string }>
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
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

export function resetDatabase(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DB_KEY)
}

export function findByPhone(phone: string): MockUser | undefined {
  const target = normalizePhone(phone)
  return getDatabase().users.find(
    (user) => normalizePhone(user.phone) === target,
  )
}

export function generateAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function delay(ms = 400 + Math.random() * 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

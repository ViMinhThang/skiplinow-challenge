import { getAdapter } from "../db.js"
import { normalizeKey } from "./access-codes.js"

export interface OwnerRecord {
  id: string
  name: string
  phone: string
  phoneNormalized: string
  role: "owner"
  createdAt: string
}

const OWNERS_COLLECTION = "owners"

function toOwner(record: {
  id: string
  [key: string]: unknown
}): OwnerRecord {
  return {
    id: record.id,
    name: String(record.name ?? ""),
    phone: String(record.phone ?? ""),
    phoneNormalized: String(record.phoneNormalized ?? ""),
    role: "owner",
    createdAt: String(record.createdAt ?? new Date().toISOString()),
  }
}

export async function ensureOwner(): Promise<void> {
  const db = getAdapter()
  const existing = await db.list(OWNERS_COLLECTION)
  if (existing.length > 0) return

  const name = process.env.OWNER_NAME ?? "Alex Owner"
  const phone = process.env.OWNER_PHONE ?? "555-0100"
  await db.set(OWNERS_COLLECTION, "owner-1", {
    id: "owner-1",
    name,
    phone,
    phoneNormalized: normalizeKey(phone),
    role: "owner",
    createdAt: new Date().toISOString(),
  })
  console.log(`[seed] owner created: ${name} (${phone})`)
}

export async function findOwnerByPhone(phone: string): Promise<OwnerRecord | null> {
  const db = getAdapter()
  const normalized = normalizeKey(phone)
  const existing = await db.list(OWNERS_COLLECTION)
  const owner = existing.find((o) => o.phoneNormalized === normalized)
  return owner ? toOwner(owner) : null
}

export async function findOwnerById(id: string): Promise<OwnerRecord | null> {
  const db = getAdapter()
  const record = await db.get(OWNERS_COLLECTION, id)
  return record ? toOwner(record) : null
}


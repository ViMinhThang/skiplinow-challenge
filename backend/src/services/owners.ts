import { getAdapter } from "../db.js"
import { config } from "../config.js"
import { normalizePhone } from "../utils/phone.js"
import { generateId } from "../utils/id.js"

export const OWNER_ID = "owner-1"

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

  const { name, phone } = config.owner
  await db.set(OWNERS_COLLECTION, OWNER_ID, {
    id: OWNER_ID,
    name,
    phone,
    phoneNormalized: normalizePhone(phone),
    role: "owner",
    createdAt: new Date().toISOString(),
  })
  console.log(`[seed] owner created: ${name} (${phone})`)
}

export async function findOwnerByPhone(
  phone: string,
): Promise<OwnerRecord | null> {
  const db = getAdapter()
  const normalized = normalizePhone(phone)
  const owners = await db.list(OWNERS_COLLECTION)
  const owner = owners.find((record) => record.phoneNormalized === normalized)
  return owner ? toOwner(owner) : null
}

export async function findOwnerById(id: string): Promise<OwnerRecord | null> {
  const db = getAdapter()
  const record = await db.get(OWNERS_COLLECTION, id)
  return record ? toOwner(record) : null
}

import { randomInt } from "node:crypto"

import { getAdapter } from "../db.js"
import { hashValue, verifyValue } from "../utils/crypto.js"

export const CODE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const ACCESS_CODES_COLLECTION = "accessCodes"

export function generateAccessCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export async function saveAccessCode(
  key: string,
  code: string,
): Promise<void> {
  const db = getAdapter()
  await db.set(ACCESS_CODES_COLLECTION, key, {
    id: key,
    codeHash: await hashValue(code),
    attempts: 0,
    expiresAt: Date.now() + CODE_TTL_MS,
  })
}

export async function verifyAccessCode(
  key: string,
  code: string,
): Promise<boolean> {
  const db = getAdapter()
  const record = await db.get(ACCESS_CODES_COLLECTION, key)
  if (!record || typeof record.codeHash !== "string") return false

  if (typeof record.expiresAt === "number" && record.expiresAt < Date.now()) {
    await db.remove(ACCESS_CODES_COLLECTION, key)
    return false
  }

  if (typeof record.attempts === "number" && record.attempts >= MAX_ATTEMPTS) {
    await db.remove(ACCESS_CODES_COLLECTION, key)
    return false
  }

  const matches = await verifyValue(code, record.codeHash)
  if (!matches) {
    await db.update(ACCESS_CODES_COLLECTION, key, {
      attempts: (typeof record.attempts === "number" ? record.attempts : 0) + 1,
    })
    return false
  }

  await db.remove(ACCESS_CODES_COLLECTION, key)
  return true
}

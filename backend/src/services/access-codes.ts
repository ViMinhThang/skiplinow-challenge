import { randomInt } from "node:crypto"

import { getAdapter } from "../db.js"
import { hashValue, verifyValue } from "../utils/crypto.js"
import { accessCodeRecordSchema } from "../validation/schemas.js"

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
  const parsed = accessCodeRecordSchema.safeParse(record)
  if (!parsed.success) return false
  const accessCode = parsed.data

  if (accessCode.expiresAt < Date.now()) {
    await db.remove(ACCESS_CODES_COLLECTION, key)
    return false
  }

  if (accessCode.attempts >= MAX_ATTEMPTS) {
    await db.remove(ACCESS_CODES_COLLECTION, key)
    return false
  }

  const matches = await verifyValue(code, accessCode.codeHash)
  if (!matches) {
    await db.update(ACCESS_CODES_COLLECTION, key, {
      attempts: accessCode.attempts + 1,
    })
    return false
  }

  await db.remove(ACCESS_CODES_COLLECTION, key)
  return true
}

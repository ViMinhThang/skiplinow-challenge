import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"

export const BCRYPT_ROUNDS = 10

export function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, BCRYPT_ROUNDS)
}

export function verifyValue(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash)
}

export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex")
}

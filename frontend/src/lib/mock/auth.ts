import { ApiError } from "@/lib/api"
import {
  delay,
  findByPhone,
  generateAccessCode,
  getDatabase,
  normalizePhone,
  persistDatabase,
} from "@/lib/mock/db"
import type {
  RequestAccessCodeResponse,
  VerifyAccessCodeResponse,
} from "@/types"

const CODE_TTL_MS = 10 * 60 * 1000

function issueToken(db: ReturnType<typeof getDatabase>, userId: string): string {
  const token = `mock-${userId}-${Math.random().toString(36).slice(2, 12)}`
  db.tokens[token] = { userId }
  persistDatabase(db)
  return token
}

export async function mockRequestAccessCode(
  phone: string,
): Promise<RequestAccessCodeResponse & { devCode?: string }> {
  await delay()

  const user = findByPhone(phone)
  if (!user) {
    throw new ApiError(
      404,
      "Phone number is not registered. Please use the number assigned to your account.",
    )
  }

  const code = generateAccessCode()
  const db = getDatabase()
  db.codes[normalizePhone(user.phone)] = {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  }
  persistDatabase(db)

  // Mock "SMS": the code would be sent via text message by the real backend.
  console.info(`[mock-sms] Access code for ${user.phone}: ${code}`)

  return {
    message: "A 6-digit access code has been sent to your phone.",
    verified: true,
    devCode: code,
  }
}

export async function mockVerifyAccessCode(
  phone: string,
  code: string,
): Promise<VerifyAccessCodeResponse> {
  await delay()

  const user = findByPhone(phone)
  if (!user) {
    throw new ApiError(404, "Phone number is not registered.")
  }

  const db = getDatabase()
  const entry = db.codes[normalizePhone(user.phone)]
  if (!entry || entry.code !== code.trim()) {
    throw new ApiError(400, "Invalid access code. Please try again.")
  }
  if (entry.expiresAt < Date.now()) {
    throw new ApiError(400, "Access code has expired. Please request a new one.")
  }

  delete db.codes[normalizePhone(user.phone)]
  const token = issueToken(db, user.id)

  return {
    message: "Code verified successfully.",
    token,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    },
  }
}

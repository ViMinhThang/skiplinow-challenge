import { ApiError } from "@/lib/api"
import {
  delay,
  findEmployeeById,
  findByPhone,
  findInviteEmployeeId,
  generateAccessCode,
  getDatabase,
  normalizePhone,
  persistDatabase,
} from "@/lib/mock/db"
import { randomAlphanumeric } from "@/lib/random"
import type { MockUser } from "@/lib/mock/db"
import type {
  LoginResponse,
  RequestAccessCodeResponse,
  SetupAccountResponse,
  User,
  VerifyAccessCodeResponse,
} from "@/types"

const CODE_TTL_MS = 10 * 60 * 1000

function issueToken(db: ReturnType<typeof getDatabase>, userId: string): string {
  const token = `mock-${userId}-${randomAlphanumeric(12)}`
  db.tokens[token] = { userId }
  persistDatabase(db)
  return token
}

function toUser(user: MockUser): User {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    email: user.email,
  }
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
  const phoneKey = normalizePhone(user.phone)
  db.codes[phoneKey] = {
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
  const phoneKey = normalizePhone(user.phone)
  const entry = db.codes[phoneKey]
  if (!entry || entry.code !== code.trim()) {
    throw new ApiError(400, "Invalid access code. Please try again.")
  }
  if (entry.expiresAt < Date.now()) {
    throw new ApiError(400, "Access code has expired. Please request a new one.")
  }

  delete db.codes[phoneKey]
  const token = issueToken(db, user.id)

  return {
    message: "Code verified successfully.",
    token,
    user: toUser(user),
  }
}

export async function mockSetupAccount(
  token: string,
  username: string,
  password: string,
): Promise<SetupAccountResponse> {
  await delay()

  const db = getDatabase()
  const invite = db.invites[token]
  const employeeId = invite?.employeeId ?? findInviteEmployeeId(token)
  if (!employeeId) {
    throw new ApiError(400, "Invalid invite link. Please request a new one.")
  }
  if (invite && invite.expiresAt < Date.now()) {
    throw new ApiError(400, "Invite link has expired. Please request a new one.")
  }

  const user = findEmployeeById(db, employeeId)
  if (!user) {
    throw new ApiError(404, "Employee not found for this invite.")
  }
  if (user.accountSetup) {
    throw new ApiError(409, "This account has already been set up.")
  }

  const normalizedUsername = username.trim().toLowerCase()
  if (db.users.some((u) => u.username?.toLowerCase() === normalizedUsername)) {
    throw new ApiError(409, "That username is already taken.")
  }

  user.username = normalizedUsername
  user.password = password
  user.accountSetup = true
  delete db.invites[token]
  persistDatabase(db)

  return { message: "Account created. You can now sign in." }
}

export async function mockLogin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  await delay()

  const db = getDatabase()
  const user = db.users.find(
    (u) =>
      u.username?.toLowerCase() === username.trim().toLowerCase() &&
      u.role === "employee",
  )
  if (!user || user.password !== password) {
    throw new ApiError(401, "Invalid username or password.")
  }

  const token = issueToken(db, user.id)
  return {
    message: "Signed in successfully.",
    token,
    user: toUser(user),
  }
}

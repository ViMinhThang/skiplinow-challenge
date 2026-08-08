import { config } from "../config.js"
import { HttpError } from "../errors/http-error.js"
import { hashValue, verifyValue } from "../utils/crypto.js"
import { generateAccessCode, saveAccessCode, verifyAccessCode } from "./access-codes.js"
import { sendAccessCodeEmail } from "./email.js"
import {
  findEmployeeByEmail,
  findEmployeeById,
  findEmployeeByInviteToken,
  findEmployeeByUsername,
  setEmployeeCredentials,
  updateOwnProfile,
  type EmployeeRecord,
} from "./employees.js"
import { findOwnerById, findOwnerByPhone, type OwnerRecord } from "./owners.js"
import { sendAccessCodeSms } from "./sms.js"
import { signToken, type AuthUser } from "./tokens.js"

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/
export const MIN_PASSWORD_LENGTH = 8

export interface OwnerUserView {
  id: string
  role: "owner"
  name: string
  phone: string
}

export interface EmployeeUserView {
  id: string
  role: "employee"
  name: string
  phone: string
  email: string
  username?: string
}

export type UserView = OwnerUserView | EmployeeUserView

export interface AuthSessionView {
  message: string
  token: string
  user: UserView
}

function toOwnerUser(owner: OwnerRecord): OwnerUserView {
  return {
    id: owner.id,
    role: "owner",
    name: owner.name,
    phone: owner.phone,
  }
}

function toEmployeeUser(employee: EmployeeRecord): EmployeeUserView {
  return {
    id: employee.id,
    role: "employee",
    name: employee.name,
    phone: employee.phone,
    email: employee.email,
    username: employee.username,
  }
}

function withDevCode<T extends { message: string }>(result: T, code: string): T & { devCode?: string } {
  return config.devMode ? { ...result, devCode: code } : result
}

export async function requestOwnerAccessCode(
  phone: string,
): Promise<{ message: string; devCode?: string }> {
  const owner = await findOwnerByPhone(phone)
  if (!owner) {
    throw new HttpError(
      404,
      "Phone number is not registered. Please use the number assigned to your account.",
    )
  }

  const code = generateAccessCode()
  await saveAccessCode(owner.phoneNormalized, code)
  await sendAccessCodeSms(owner.phone, code)

  return withDevCode({ message: "Access code sent. Check your texts." }, code)
}

export async function verifyOwnerAccessCode(
  phone: string,
  code: string,
): Promise<AuthSessionView & { success: true }> {
  const owner = await findOwnerByPhone(phone)
  if (!owner) {
    throw new HttpError(
      404,
      "Phone number is not registered. Please use the number assigned to your account.",
    )
  }
  const valid = await verifyAccessCode(owner.phoneNormalized, code)
  if (!valid) throw new HttpError(401, "Invalid or expired access code.")

  return {
    success: true,
    message: "Logged in successfully.",
    token: signToken({ id: owner.id, role: "owner" }),
    user: toOwnerUser(owner),
  }
}

export async function requestEmployeeAccessCode(
  email: string,
): Promise<{ message: string; devCode?: string }> {
  const employee = await findEmployeeByEmail(email)
  if (!employee) {
    throw new HttpError(404, "No employee found with this email address.")
  }

  const code = generateAccessCode()
  await saveAccessCode(email, code)
  await sendAccessCodeEmail(employee.email, code)

  return withDevCode({ message: "Access code sent. Check your email." }, code)
}

export async function verifyEmployeeAccessCode(
  email: string,
  code: string,
): Promise<AuthSessionView & { success: true }> {
  const employee = await findEmployeeByEmail(email)
  if (!employee) throw new HttpError(404, "No employee found with this email address.")

  const valid = await verifyAccessCode(email, code)
  if (!valid) throw new HttpError(401, "Invalid or expired access code.")

  return {
    success: true,
    message: "Logged in successfully.",
    token: signToken({ id: employee.id, role: "employee" }),
    user: toEmployeeUser(employee),
  }
}

export async function setupEmployeeAccount(
  token: string,
  username: string,
  password: string,
): Promise<{ message: string }> {
  if (!token) throw new HttpError(400, "Setup token is required.")
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpError(
      400,
      "Username must be 3–30 characters (letters, numbers, dot, dash, underscore).",
    )
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, "Password must be at least 8 characters.")
  }

  const employee = await findEmployeeByInviteToken(token)
  if (!employee) throw new HttpError(401, "Invalid or expired setup link.")
  if (
    typeof employee.inviteExpiresAt === "number" &&
    employee.inviteExpiresAt < Date.now()
  ) {
    throw new HttpError(
      401,
      "This setup link has expired. Ask your manager to resend it.",
    )
  }
  if (await findEmployeeByUsername(username)) {
    throw new HttpError(409, "This username is already taken.")
  }

  await setEmployeeCredentials(employee.id, username, await hashValue(password))
  return { message: "Account set up successfully. You can now log in." }
}

export async function loginEmployee(
  username: string,
  password: string,
): Promise<AuthSessionView> {
  const employee = await findEmployeeByUsername(username)
  if (!employee?.passwordHash) {
    throw new HttpError(401, "Invalid username or password.")
  }
  if (!(await verifyValue(password, employee.passwordHash))) {
    throw new HttpError(401, "Invalid username or password.")
  }

  return {
    message: "Logged in successfully.",
    token: signToken({ id: employee.id, role: "employee" }),
    user: toEmployeeUser(employee),
  }
}

export async function getCurrentUser(user: AuthUser): Promise<{ user: UserView }> {
  if (user.role === "owner") {
    const owner = await findOwnerById(user.id)
    if (!owner) throw new HttpError(404, "User not found.")
    return { user: toOwnerUser(owner) }
  }

  const employee = await findEmployeeById(user.id)
  if (!employee) throw new HttpError(404, "User not found.")
  return { user: toEmployeeUser(employee) }
}

export async function updateCurrentUser(
  user: AuthUser,
  patch: { name?: string; phone?: string; email?: string },
): Promise<{ user: EmployeeUserView }> {
  if (user.role !== "employee") {
    throw new HttpError(
      403,
      "Owner profile details cannot be changed here.",
    )
  }

  const updated = await updateOwnProfile(user.id, patch)
  return { user: toEmployeeUser(updated) }
}

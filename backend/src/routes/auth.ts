import { Router } from "express"
import bcrypt from "bcryptjs"
import rateLimit from "express-rate-limit"

import { HttpError } from "../app.js"
import { asyncHandler } from "../middleware/async-handler.js"
import { requireAuth } from "../middleware/require-auth.js"
import {
  generateAccessCode,
  normalizeKey,
  saveAccessCode,
  verifyAccessCode,
} from "../services/access-codes.js"
import { findOwnerById, findOwnerByPhone } from "../services/owners.js"
import { sendAccessCodeSms } from "../services/sms.js"
import { signToken } from "../services/tokens.js"
import { config } from "../config.js"
import {
  findByEmail,
  findByInviteToken,
  findByUsername,
  getEmployeeRecord,
  setEmployeeCredentials,
} from "../services/employees.js"
import { sendAccessCodeEmail } from "../services/email.js"
import type { EmployeeRecord } from "../services/employees.js"

function toAuthUser(employee: EmployeeRecord) {
  return {
    id: employee.id,
    role: "employee" as const,
    name: employee.name,
    phone: employee.phone,
    email: employee.email,
    username: employee.username,
  }
}

export const authRouter: Router = Router()

const requestCodeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again in a minute." },
})

authRouter.post(
  "/request-code",
  requestCodeLimiter,
  asyncHandler(async (req, res) => {
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""

    const owner = await findOwnerByPhone(phone)
    if (!owner) {
      throw new HttpError(
        404,
        "Phone number is not registered. Please use the number assigned to your account.",
      )
    }

    const code = generateAccessCode()
    await saveAccessCode(normalizeKey(owner.phone), code)
    await sendAccessCodeSms(owner.phone, code)

    res.json({
      message: "Access code sent. Check your texts.",
      ...(config.devMode ? { devCode: code } : {}),
    })
  }),
)

authRouter.post(
  "/verify-code",
  asyncHandler(async (req, res) => {
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : ""
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : ""

    const owner = await findOwnerByPhone(phone)
    if (!owner) {
      throw new HttpError(
        404,
        "Phone number is not registered. Please use the number assigned to your account.",
      )
    }
    const valid = await verifyAccessCode(normalizeKey(owner.phone), code)
    if (!valid) {
      throw new HttpError(401, "Invalid or expired access code.")
    }

    const token = signToken({ id: owner.id, role: "owner" })
    res.json({
      message: "Logged in successfully.",
      token,
      user: {
        id: owner.id,
        role: "owner",
        name: owner.name,
        phone: owner.phone,
      },
    })
  }),
)

authRouter.get(
  "/me",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (req.user!.role === "owner") {
      const owner = await findOwnerById(req.user!.id)
      if (!owner) throw new HttpError(404, "User not found.")
      res.json({
        user: {
          id: owner.id,
          role: "owner",
          name: owner.name,
          phone: owner.phone,
        },
      })
      return
    }
    const employee = await getEmployeeRecord(req.user!.id)
    if (!employee) throw new HttpError(404, "User not found.")
    res.json({ user: toAuthUser(employee) })
  }),
)

authRouter.post(
  "/setup",
  asyncHandler(async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : ""
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : ""
    const password = typeof req.body?.password === "string" ? req.body.password : ""

    if (!token) throw new HttpError(400, "Setup token is required.")
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      throw new HttpError(400, "Username must be 3–30 characters (letters, numbers, dot, dash, underscore).")
    }
    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters.")
    }

    const employee = await findByInviteToken(token)
    if (!employee) throw new HttpError(401, "Invalid or expired setup link.")
    if (typeof employee.inviteExpiresAt === "number" && employee.inviteExpiresAt < Date.now()) {
      throw new HttpError(401, "This setup link has expired. Ask your manager to resend it.")
    }
    if (await findByUsername(username)) {
      throw new HttpError(409, "This username is already taken.")
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await setEmployeeCredentials(employee.id, username, passwordHash)
    res.json({ message: "Account set up successfully. You can now log in." })
  }),
)

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : ""
    const password = typeof req.body?.password === "string" ? req.body.password : ""

    const employee = await findByUsername(username)
    if (!employee?.passwordHash) {
      throw new HttpError(401, "Invalid username or password.")
    }
    const matches = await bcrypt.compare(password, employee.passwordHash)
    if (!matches) throw new HttpError(401, "Invalid username or password.")

    const token = signToken({ id: employee.id, role: "employee" })
    res.json({ message: "Logged in successfully.", token, user: toAuthUser(employee) })
  }),
)

authRouter.post(
  "/login-email",
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
    const employee = await findByEmail(email)
    if (!employee) {
      throw new HttpError(404, "No employee found with this email address.")
    }
    const code = generateAccessCode()
    await saveAccessCode(email, code)
    await sendAccessCodeEmail(employee.email, code)
    res.json({
      message: "Access code sent. Check your email.",
      ...(config.devMode ? { devCode: code } : {}),
    })
  }),
)

authRouter.post(
  "/validate-email-code",
  asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : ""

    const employee = await findByEmail(email)
    if (!employee) throw new HttpError(404, "No employee found with this email address.")
    const valid = await verifyAccessCode(email, code)
    if (!valid) throw new HttpError(401, "Invalid or expired access code.")

    const token = signToken({ id: employee.id, role: "employee" })
    res.json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: toAuthUser(employee),
    })
  }),
)


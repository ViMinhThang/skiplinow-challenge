import { Router } from "express"
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
    throw new HttpError(404, "User not found.")
  }),
)


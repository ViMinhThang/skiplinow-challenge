import { Router } from "express"

import { requireAuth, getAuthUser } from "../middleware/require-auth.js"
import { requestCodeLimiter } from "../middleware/rate-limit.js"
import {
  getCurrentUser,
  loginEmployee,
  requestEmployeeAccessCode,
  requestOwnerAccessCode,
  setupEmployeeAccount,
  updateCurrentUser,
  verifyEmployeeAccessCode,
  verifyOwnerAccessCode,
} from "../services/auth.js"
import { parseBody } from "../utils/parse.js"
import {
  emailCodeSchema,
  emailInputSchema,
  loginSchema,
  patchMeSchema,
  phoneInputSchema,
  setupSchema,
  verifyCodeSchema,
} from "../validation/schemas.js"

export const authRouter: Router = Router()

authRouter.post("/create-new-access-code", requestCodeLimiter, async (req, res) => {
  const { phone } = parseBody(req.body, phoneInputSchema)
  res.json(await requestOwnerAccessCode(phone))
})

authRouter.post("/validate-access-code", async (req, res) => {
  const { phone, code } = parseBody(req.body, verifyCodeSchema)
  res.json(await verifyOwnerAccessCode(phone, code))
})

authRouter.get("/me", requireAuth(), async (req, res) => {
  res.json(await getCurrentUser(getAuthUser(req)))
})

authRouter.patch("/me", requireAuth(), async (req, res) => {
  const input = parseBody(req.body, patchMeSchema)
  res.json(await updateCurrentUser(getAuthUser(req), input))
})

authRouter.post("/setup", async (req, res) => {
  const { token, username, password } = parseBody(req.body, setupSchema)
  res.json(await setupEmployeeAccount(token, username, password))
})

authRouter.post("/login", async (req, res) => {
  const { username, password } = parseBody(req.body, loginSchema)
  res.json(await loginEmployee(username, password))
})

authRouter.post("/login-email", async (req, res) => {
  const { email } = parseBody(req.body, emailInputSchema)
  res.json(await requestEmployeeAccessCode(email))
})

authRouter.post("/validate-email-code", async (req, res) => {
  const { email, code } = parseBody(req.body, emailCodeSchema)
  res.json(await verifyEmployeeAccessCode(email, code))
})

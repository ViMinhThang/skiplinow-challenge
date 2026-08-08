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
import { readString } from "../utils/http.js"

export const authRouter: Router = Router()

authRouter.post("/request-code", requestCodeLimiter, async (req, res) => {
  res.json(await requestOwnerAccessCode(readString(req.body, "phone")))
})

authRouter.post("/verify-code", async (req, res) => {
  res.json(
    await verifyOwnerAccessCode(
      readString(req.body, "phone"),
      readString(req.body, "code"),
    ),
  )
})

authRouter.get("/me", requireAuth(), async (req, res) => {
  res.json(await getCurrentUser(getAuthUser(req)))
})

authRouter.patch("/me", requireAuth(), async (req, res) => {
  const input = req.body ?? {}
  const optional = (key: string) =>
    key in input ? readString(input, key) : undefined
  res.json(
    await updateCurrentUser(getAuthUser(req), {
      name: optional("name"),
      phone: optional("phone"),
      email: optional("email"),
    }),
  )
})

authRouter.post("/setup", async (req, res) => {
  res.json(
    await setupEmployeeAccount(
      readString(req.body, "token"),
      readString(req.body, "username"),
      readString(req.body, "password"),
    ),
  )
})

authRouter.post("/login", async (req, res) => {
  res.json(
    await loginEmployee(
      readString(req.body, "username"),
      readString(req.body, "password"),
    ),
  )
})

authRouter.post("/login-email", async (req, res) => {
  res.json(await requestEmployeeAccessCode(readString(req.body, "email")))
})

authRouter.post("/validate-email-code", async (req, res) => {
  res.json(
    await verifyEmployeeAccessCode(
      readString(req.body, "email"),
      readString(req.body, "code"),
    ),
  )
})

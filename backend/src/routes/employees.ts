import { Router } from "express"

import { HttpError } from "../errors/http-error.js"
import { requireAuth } from "../middleware/require-auth.js"
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  resendInvite,
  updateEmployee,
  updateSchedule,
} from "../services/employees.js"
import { readString } from "../utils/http.js"

export const employeesRouter: Router = Router()

employeesRouter.use(requireAuth())

employeesRouter.get("/", async (_req, res) => {
  res.json(await listEmployees())
})

employeesRouter.post("/", requireAuth("owner"), async (req, res) => {
  const input = req.body ?? {}
  const employee = await createEmployee({
    name: readString(input, "name"),
    phone: readString(input, "phone"),
    email: readString(input, "email"),
    role: readString(input, "role") || readString(input, "department"),
  })
  res.status(201).json(employee)
})

employeesRouter.post("/get", requireAuth("owner"), async (req, res) => {
  res.json(await getEmployee(readString(req.body, "employeeId")))
})

employeesRouter.get("/:id", async (req, res) => {
  res.json(await getEmployee(String(req.params.id ?? "")))
})

employeesRouter.patch("/:id", requireAuth("owner"), async (req, res) => {
  const input = req.body ?? {}
  res.json(
    await updateEmployee(String(req.params.id ?? ""), {
      name: readString(input, "name") || undefined,
      phone: readString(input, "phone") || undefined,
      email: readString(input, "email") || undefined,
      role: readString(input, "role") || undefined,
    }),
  )
})

employeesRouter.delete("/:id", requireAuth("owner"), async (req, res) => {
  res.json(await deleteEmployee(String(req.params.id ?? "")))
})

employeesRouter.put("/:id/schedule", requireAuth("owner"), async (req, res) => {
  res.json(
    await updateSchedule(String(req.params.id ?? ""), req.body?.entries),
  )
})

employeesRouter.post("/:id", requireAuth("owner"), async (req, res) => {
  if (req.body?.action !== "resend-invite") {
    throw new HttpError(400, "Unknown action.")
  }
  res.json(await resendInvite(String(req.params.id ?? "")))
})

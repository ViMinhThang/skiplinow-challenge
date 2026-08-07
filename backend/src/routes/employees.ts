import { Router } from "express"

import { HttpError } from "../app.js"
import { asyncHandler } from "../middleware/async-handler.js"
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

export const employeesRouter: Router = Router()

employeesRouter.use(requireAuth())

employeesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listEmployees())
  }),
)

employeesRouter.post(
  "/",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    const input = req.body ?? {}
    const employee = await createEmployee({
      name: input.name,
      phone: input.phone,
      email: input.email,
      role: input.role ?? input.department,
    })
    res.status(201).json(employee)
  }),
)

employeesRouter.post(
  "/get",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    const employeeId =
      typeof req.body?.employeeId === "string" ? req.body.employeeId : ""
    res.json(await getEmployee(employeeId))
  }),
)

employeesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await getEmployee(String(req.params.id ?? "")))
  }),
)

employeesRouter.patch(
  "/:id",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    const input = req.body ?? {}
    res.json(
      await updateEmployee(String(req.params.id ?? ""), {
        name: input.name,
        phone: input.phone,
        email: input.email,
        role: input.role,
      }),
    )
  }),
)

employeesRouter.delete(
  "/:id",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    res.json(await deleteEmployee(String(req.params.id ?? "")))
  }),
)

employeesRouter.put(
  "/:id/schedule",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    const entries = req.body?.entries
    res.json(await updateSchedule(String(req.params.id ?? ""), entries))
  }),
)

employeesRouter.post(
  "/:id",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    if (req.body?.action === "resend-invite") {
      res.json(await resendInvite(String(req.params.id ?? "")))
      return
    }
    throw new HttpError(400, "Unknown action.")
  }),
)


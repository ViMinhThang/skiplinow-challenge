import { Router } from "express"

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
import { parseBody } from "../utils/parse.js"
import {
  createEmployeeSchema,
  employeeIdSchema,
  resendInviteSchema,
  scheduleInputSchema,
  updateEmployeeSchema,
} from "../validation/schemas.js"

export const employeesRouter: Router = Router()

employeesRouter.use(requireAuth())

employeesRouter.get("/", async (_req, res) => {
  res.json(await listEmployees())
})

employeesRouter.post("/create-employee", requireAuth("owner"), async (req, res) => {
  const input = parseBody(req.body, createEmployeeSchema)
  const employee = await createEmployee({
    name: input.name,
    email: input.email,
    department: input.department,
  })
  res.status(201).json(employee)
})

employeesRouter.post("/get-employee", requireAuth("owner"), async (req, res) => {
  const { employeeId } = parseBody(req.body, employeeIdSchema)
  res.json(await getEmployee(employeeId))
})

employeesRouter.post("/delete-employee", requireAuth("owner"), async (req, res) => {
  const { employeeId } = parseBody(req.body, employeeIdSchema)
  res.json(await deleteEmployee(employeeId))
})

employeesRouter.get("/:id", async (req, res) => {
  res.json(await getEmployee(String(req.params.id ?? "")))
})

employeesRouter.patch("/:id", requireAuth("owner"), async (req, res) => {
  const input = parseBody(req.body, updateEmployeeSchema)
  res.json(await updateEmployee(String(req.params.id ?? ""), {
    name: input.name,
    phone: input.phone,
    email: input.email,
    role: input.role ?? input.department,
  }))
})

employeesRouter.delete("/:id", requireAuth("owner"), async (req, res) => {
  res.json(await deleteEmployee(String(req.params.id ?? "")))
})

employeesRouter.put("/:id/schedule", requireAuth("owner"), async (req, res) => {
  const { entries } = parseBody(req.body, scheduleInputSchema)
  res.json(await updateSchedule(String(req.params.id ?? ""), entries))
})

employeesRouter.post("/:id", requireAuth("owner"), async (req, res) => {
  parseBody(req.body, resendInviteSchema)
  res.json(await resendInvite(String(req.params.id ?? "")))
})

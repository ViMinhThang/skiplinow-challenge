import { Router } from "express"

import { getAuthUser, requireAuth } from "../middleware/require-auth.js"
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../services/tasks.js"
import {
  emitTaskCreated,
  emitTaskDeleted,
  emitTaskUpdated,
} from "../sockets/task-events.js"
import { parseBody } from "../utils/parse.js"
import { createTaskSchema, updateTaskSchema } from "../validation/schemas.js"

export const tasksRouter: Router = Router()

tasksRouter.use(requireAuth())

tasksRouter.get("/", async (_req, res) => {
  res.json(await listTasks())
})

tasksRouter.post("/", requireAuth("owner"), async (req, res) => {
  const input = parseBody(req.body, createTaskSchema)
  const task = await createTask(
    {
      title: input.title,
      description: input.description || undefined,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate || undefined,
    },
    getAuthUser(req).id,
  )
  emitTaskCreated(task)
  res.status(201).json(task)
})

tasksRouter.patch("/:id", async (req, res) => {
  const input = parseBody(req.body, updateTaskSchema)
  const task = await updateTask(String(req.params.id ?? ""), input, getAuthUser(req))
  emitTaskUpdated(task)
  res.json(task)
})

tasksRouter.delete("/:id", requireAuth("owner"), async (req, res) => {
  const result = await deleteTask(String(req.params.id ?? ""))
  emitTaskDeleted(result.task)
  res.json({ message: result.message })
})

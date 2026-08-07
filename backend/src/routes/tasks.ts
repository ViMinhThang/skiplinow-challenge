import { Router } from "express"

import { asyncHandler } from "../middleware/async-handler.js"
import { requireAuth } from "../middleware/require-auth.js"
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../services/tasks.js"

export const tasksRouter: Router = Router()

tasksRouter.use(requireAuth())

tasksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listTasks())
  }),
)

tasksRouter.post(
  "/",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    const input = req.body ?? {}
    const task = await createTask(
      {
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
      },
      req.user!.id,
    )
    res.status(201).json(task)
  }),
)

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = req.body ?? {}
    res.json(
      await updateTask(
        String(req.params.id ?? ""),
        {
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate,
          status: input.status,
        },
        req.user!,
      ),
    )
  }),
)

tasksRouter.delete(
  "/:id",
  requireAuth("owner"),
  asyncHandler(async (req, res) => {
    res.json(await deleteTask(String(req.params.id ?? "")))
  }),
)

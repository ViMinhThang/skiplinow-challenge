import { Router } from "express"

import { getAuthUser, requireAuth } from "../middleware/require-auth.js"
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../services/tasks.js"
import { readString } from "../utils/http.js"

export const tasksRouter: Router = Router()

tasksRouter.use(requireAuth())

tasksRouter.get("/", async (_req, res) => {
  res.json(await listTasks())
})

tasksRouter.post("/", requireAuth("owner"), async (req, res) => {
  const input = req.body ?? {}
  const task = await createTask(
    {
      title: readString(input, "title"),
      description: readString(input, "description") || undefined,
      assigneeId: readString(input, "assigneeId"),
      dueDate: readString(input, "dueDate") || undefined,
    },
    getAuthUser(req).id,
  )
  res.status(201).json(task)
})

tasksRouter.patch("/:id", async (req, res) => {
  const input = req.body ?? {}
  const task = await updateTask(
    String(req.params.id ?? ""),
    {
      title: input.title === undefined ? undefined : readString(input, "title"),
      description:
        input.description === undefined
          ? undefined
          : readString(input, "description"),
      assigneeId:
        input.assigneeId === undefined
          ? undefined
          : readString(input, "assigneeId"),
      dueDate:
        input.dueDate === undefined ? undefined : readString(input, "dueDate"),
      status: input.status === undefined ? undefined : readString(input, "status") as "todo" | "in_progress" | "done",
    },
    getAuthUser(req),
  )
  res.json(task)
})

tasksRouter.delete("/:id", requireAuth("owner"), async (req, res) => {
  res.json(await deleteTask(String(req.params.id ?? "")))
})

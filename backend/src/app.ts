import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"

import { config } from "./config.js"
import { errorHandler, notFoundHandler } from "./middleware/errors.js"
import { authRouter } from "./routes/auth.js"
import { conversationsRouter } from "./routes/conversations.js"
import { employeesRouter } from "./routes/employees.js"
import { healthRouter } from "./routes/health.js"
import { tasksRouter } from "./routes/tasks.js"

export function createApp() {
  const app = express()

  app.set("trust proxy", 1)
  app.use(helmet())
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: "1mb" }))
  if (config.nodeEnv !== "test") {
    app.use(morgan("dev"))
  }

  app.use("/api", healthRouter)
  app.use("/api/auth", authRouter)
  app.use("/api/employees", employeesRouter)
  app.use("/api/tasks", tasksRouter)
  app.use("/api/conversations", conversationsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

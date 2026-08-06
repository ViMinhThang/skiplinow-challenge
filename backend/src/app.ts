import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import type { NextFunction, Request, Response } from "express"

import { config } from "./config.js"
import { healthRouter } from "./routes/health.js"

export class HttpError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.details = details
  }
}

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

  app.use((_req, res) => {
    res.status(404).json({ message: "Route not found." })
  })

  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) })
        return
      }
      const message = err instanceof Error ? err.message : "Internal server error."
      console.error(message)
      res.status(500).json({ message: "Internal server error." })
    },
  )

  return app
}


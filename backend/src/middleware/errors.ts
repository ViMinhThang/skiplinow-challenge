import type { NextFunction, Request, Response } from "express"

import { HttpError } from "../errors/http-error.js"

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found." })
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    })
    return
  }

  const message = err instanceof Error ? err.message : "Internal server error."
  console.error(message)
  res.status(500).json({ message: "Internal server error." })
}

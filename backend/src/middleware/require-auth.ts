import type { NextFunction, Request, RequestHandler, Response } from "express"

import { HttpError } from "../app.js"
import { verifyToken, type AuthUser } from "../services/tokens.js"

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser
  }
}

export function requireAuth(
  role?: AuthUser["role"],
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""
    const user = token ? verifyToken(token) : null
    if (!user) {
      next(new HttpError(401, "Authentication required."))
      return
    }
    if (role && user.role !== role) {
      next(new HttpError(403, "You do not have access to this resource."))
      return
    }
    req.user = user
    next()
  }
}


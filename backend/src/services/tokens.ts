import jwt from "jsonwebtoken"

import { config } from "../config.js"

export interface AuthUser {
  id: string
  role: "owner" | "employee"
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    if (typeof payload === "string" || !payload.sub || !payload.role) return null
    return {
      id: String(payload.sub),
      role: payload.role === "employee" ? "employee" : "owner",
    }
  } catch {
    return null
  }
}


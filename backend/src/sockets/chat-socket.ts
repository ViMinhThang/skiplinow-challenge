import { createServer } from "node:http"
import { Server } from "socket.io"

import { config } from "../config.js"
import { verifyToken, type AuthUser } from "../services/tokens.js"

declare module "socket.io" {
  interface Socket {
    user?: AuthUser
  }
}

export function createChatSocket(httpServer: ReturnType<typeof createServer>): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    const user = typeof token === "string" ? verifyToken(token) : null
    if (!user) {
      next(new Error("Authentication required."))
      return
    }
    socket.user = user
    next()
  })

  io.on("connection", (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`)
  })

  return io
}

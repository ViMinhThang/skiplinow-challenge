import { io, type Socket } from "socket.io-client"

import { SOCKET_URL } from "@/lib/constants"

let socket: Socket | null = null
let currentToken: string | null = null

export function getChatSocket(token: string): Socket {
  if (!token) throw new Error("A session token is required to connect.")
  if (socket && currentToken === token) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }
  currentToken = token
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  })
  return socket
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
    currentToken = null
  }
}

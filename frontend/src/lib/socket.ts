import { io, type Socket } from "socket.io-client"

import { SOCKET_URL } from "@/lib/constants"
import type { AuthSession } from "@/types"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
  })
  return socket
}

export function connectSocket(session: AuthSession | null): Socket {
  const client = getSocket()
  if (session && !client.connected) {
    client.auth = { token: session.token }
    client.connect()
  } else if (!session) {
    disconnectSocket()
  }
  return client
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

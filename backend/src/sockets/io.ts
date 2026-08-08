import type { Server } from "socket.io"

let io: Server | null = null

export function attachSocketServer(server: Server): void {
  io = server
}

export function emitToUser(
  userId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(`user:${userId}`).emit(event, payload)
}

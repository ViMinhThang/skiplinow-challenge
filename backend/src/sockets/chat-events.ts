import type { Server } from "socket.io"

import type { ChatMessage } from "../services/conversations.js"

let io: Server | null = null

export function attachChatSocket(server: Server): void {
  io = server
}

function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload)
}

export function emitChatMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  message: ChatMessage,
): void {
  const payload = { conversationId, message }
  emitToUser(senderId, "chat:message", payload)
  emitToUser(recipientId, "chat:message", payload)
}

export function emitConversationCreated(
  conversationId: string,
  participantIds: string[],
): void {
  for (const participantId of participantIds) {
    emitToUser(participantId, "chat:new", { conversationId })
  }
}

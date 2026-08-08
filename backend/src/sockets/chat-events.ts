import type { ChatMessage } from "../services/conversations.js"
import { emitToUser } from "./io.js"

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

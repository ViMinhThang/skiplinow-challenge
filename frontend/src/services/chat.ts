import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import {
  chatMessageSchema,
  conversationViewSchema,
} from "@/lib/schemas"
import type { ChatMessage, ConversationView } from "@/types"

export async function listConversations(): Promise<ConversationView[]> {
  return api.get(API_ENDPOINTS.conversations, {
    schema: conversationViewSchema.array(),
  })
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  return api.get(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
    { schema: chatMessageSchema.array() },
  )
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  return api.post(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
    { content },
    { schema: chatMessageSchema },
  )
}

export async function createConversation(
  ownerId: string,
  employeeId: string,
): Promise<ConversationView> {
  return api.post(
    API_ENDPOINTS.conversations,
    { participantIds: [ownerId, employeeId] },
    { schema: conversationViewSchema },
  )
}

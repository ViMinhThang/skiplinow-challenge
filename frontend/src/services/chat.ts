import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import type { ChatMessage, ConversationView } from "@/types"

export async function listConversations(): Promise<ConversationView[]> {
  return api.get<ConversationView[]>(API_ENDPOINTS.conversations)
}

export async function getMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
  )
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  return api.post<ChatMessage>(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
    { content },
  )
}

export async function createConversation(
  ownerId: string,
  employeeId: string,
): Promise<ConversationView> {
  return api.post<ConversationView>(API_ENDPOINTS.conversations, {
    participantIds: [ownerId, employeeId],
  })
}

import { api } from "@/lib/api"
import { API_ENDPOINTS, USE_MOCK } from "@/lib/constants"
import {
  mockCreateConversation,
  mockGetMessages,
  mockListConversations,
  mockSendMessage,
} from "@/lib/mock/chat"
import type { ChatMessage, ConversationView } from "@/types"

export async function listConversations(
  userId: string,
): Promise<ConversationView[]> {
  if (USE_MOCK) return mockListConversations(userId)
  return api.get<ConversationView[]>(API_ENDPOINTS.conversations)
}

export async function getMessages(
  conversationId: string,
  userId: string,
): Promise<ChatMessage[]> {
  if (USE_MOCK) return mockGetMessages(conversationId, userId)
  return api.get<ChatMessage[]>(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
  )
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<ChatMessage> {
  if (USE_MOCK) return mockSendMessage(conversationId, senderId, content)
  return api.post<ChatMessage>(
    `${API_ENDPOINTS.conversations}/${conversationId}${API_ENDPOINTS.messages}`,
    { senderId, content },
  )
}

export async function createConversation(
  ownerId: string,
  employeeId: string,
): Promise<ConversationView> {
  if (USE_MOCK) return mockCreateConversation(ownerId, employeeId)
  return api.post<ConversationView>(API_ENDPOINTS.conversations, {
    participantIds: [ownerId, employeeId],
  })
}

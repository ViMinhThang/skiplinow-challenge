import { ApiError } from "@/lib/api"
import {
  delay,
  getDatabase,
  persistDatabase,
} from "@/lib/mock/db"
import type {
  ChatMessage,
  Conversation,
  ConversationView,
} from "@/types"

const CANNED_REPLIES = [
  "Got it, I'll take a look now.",
  "Sounds good, thanks for the heads up!",
  "Sure, I can do that by end of day.",
  "Let me check and get back to you shortly.",
  "Makes sense. Let's go with that plan.",
  "Will do! I'll share an update soon.",
]

function nowIso(): string {
  return new Date().toISOString()
}

function toId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function findConversation(
  db: ReturnType<typeof getDatabase>,
  id: string,
): Conversation {
  const conversation = db.conversations.find((c) => c.id === id)
  if (!conversation) throw new ApiError(404, "Conversation not found.")
  return conversation
}

function requireParticipant(conversation: Conversation, userId: string): void {
  if (!conversation.participantIds.includes(userId)) {
    throw new ApiError(403, "You are not part of this conversation.")
  }
}

function toConversationView(
  usersById: Map<string, { id: string; name: string }>,
  conversation: Conversation,
): ConversationView {
  const participants: { id: string; name: string }[] = []
  for (const id of conversation.participantIds) {
    const user = usersById.get(id)
    if (user) participants.push(user)
  }
  return {
    ...conversation,
    messages: sortMessages(conversation.messages),
    participants,
  }
}

function deliverAutoReply(conversation: Conversation, replyIndex: number): void {
  const db = getDatabase()
  const existing = db.conversations.find((c) => c.id === conversation.id)
  if (!existing) return
  const lastMessage = conversation.messages[conversation.messages.length - 1]
  const senderId = lastMessage.recipientId
  const now = nowIso()
  existing.messages.push({
    id: toId("msg"),
    conversationId: conversation.id,
    senderId,
    recipientId: lastMessage.senderId,
    content: CANNED_REPLIES[replyIndex % CANNED_REPLIES.length],
    createdAt: now,
  })
  existing.lastMessageAt = now
  persistDatabase(db)
}

export async function mockListConversations(
  userId: string,
): Promise<ConversationView[]> {
  await delay(250)
  const db = getDatabase()
  const usersById = new Map(db.users.map((u) => [u.id, { id: u.id, name: u.name }]))
  const mine: ConversationView[] = []
  for (const conversation of db.conversations) {
    if (!conversation.participantIds.includes(userId)) continue
    mine.push(toConversationView(usersById, conversation))
  }
  return mine.sort((a, b) =>
    (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
  )
}

export async function mockGetMessages(
  conversationId: string,
  userId: string,
): Promise<ChatMessage[]> {
  await delay(150)
  const db = getDatabase()
  const conversation = findConversation(db, conversationId)
  requireParticipant(conversation, userId)
  return sortMessages(conversation.messages)
}

export async function mockSendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<ChatMessage> {
  await delay(100)
  const db = getDatabase()
  const conversation = findConversation(db, conversationId)
  requireParticipant(conversation, senderId)

  const body = content.trim()
  if (!body) throw new ApiError(400, "Message cannot be empty.")

  const recipientId = conversation.participantIds.find((id) => id !== senderId)
  if (!recipientId) throw new ApiError(400, "Conversation has no recipient.")

  const now = nowIso()
  const message: ChatMessage = {
    id: toId("msg"),
    conversationId,
    senderId,
    recipientId,
    content: body,
    createdAt: now,
  }
  conversation.messages.push(message)
  conversation.lastMessageAt = now
  persistDatabase(db)

  const replyIndex = conversation.messages.length
  setTimeout(() => deliverAutoReply(conversation, replyIndex), 1800)

  return message
}

export async function mockCreateConversation(
  ownerId: string,
  employeeId: string,
): Promise<ConversationView> {
  await delay()
  const db = getDatabase()
  const participantIds = [ownerId, employeeId].sort()

  const existing = db.conversations.find(
    (c) =>
      c.participantIds.length === 2 &&
      participantIds.every((id) => c.participantIds.includes(id)),
  )
  const usersById = new Map(
    db.users.map((u) => [u.id, { id: u.id, name: u.name }]),
  )
  if (existing) return toConversationView(usersById, existing)

  const conversation: Conversation = {
    id: toId("conv"),
    participantIds,
    messages: [],
    lastMessageAt: undefined,
  }
  db.conversations.push(conversation)
  persistDatabase(db)
  return toConversationView(usersById, conversation)
}

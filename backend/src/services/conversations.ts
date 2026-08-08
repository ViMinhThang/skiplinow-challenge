import { getAdapter } from "../db.js"
import { HttpError } from "../errors/http-error.js"
import { generateId } from "../utils/id.js"
import {
  chatMessageSchema,
  conversationRecordSchema,
} from "../validation/schemas.js"
import type { z } from "zod"
import { findOwnerById } from "./owners.js"
import { findEmployeeById } from "./employees.js"

const CONVERSATIONS_COLLECTION = "conversations"

export type ChatMessage = z.infer<typeof chatMessageSchema>

export interface ConversationParticipant {
  id: string
  name: string
}

export interface ConversationView {
  id: string
  participantIds: string[]
  messages: ChatMessage[]
  lastMessageAt?: string
  participants: ConversationParticipant[]
}

export interface ConversationRecord {
  id: string
  participantIds: string[]
  messages: ChatMessage[]
  lastMessageAt?: string
}

function fromRecord(record: {
  id: string
  [key: string]: unknown
}): ConversationRecord {
  return conversationRecordSchema.parse(record)
}

async function findRecord(id: string): Promise<ConversationRecord | null> {
  const db = getAdapter()
  const record = await db.get(CONVERSATIONS_COLLECTION, id)
  return record ? fromRecord(record) : null
}

async function resolveName(userId: string): Promise<string | null> {
  const owner = await findOwnerById(userId)
  if (owner) return owner.name
  const employee = await findEmployeeById(userId)
  return employee?.name ?? null
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function toView(record: ConversationRecord): Promise<ConversationView> {
  const participants: ConversationParticipant[] = []
  for (const id of record.participantIds) {
    const name = await resolveName(id)
    if (name) participants.push({ id, name })
  }
  return {
    id: record.id,
    participantIds: record.participantIds,
    messages: sortMessages(record.messages),
    lastMessageAt: record.lastMessageAt,
    participants,
  }
}

function assertParticipant(record: ConversationRecord, userId: string): void {
  if (!record.participantIds.includes(userId)) {
    throw new HttpError(403, "You are not part of this conversation.")
  }
}

export async function listConversations(
  userId: string,
): Promise<ConversationView[]> {
  const db = getAdapter()
  const records = await db.list(CONVERSATIONS_COLLECTION)
  const mine = records.filter((record) =>
    fromRecord(record).participantIds.includes(userId),
  )
  const views: ConversationView[] = []
  for (const record of mine) {
    views.push(await toView(fromRecord(record)))
  }
  return views.sort((a, b) =>
    (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""),
  )
}

export async function getMessages(
  conversationId: string,
  userId: string,
): Promise<ChatMessage[]> {
  const record = await findRecord(conversationId)
  if (!record) throw new HttpError(404, "Conversation not found.")
  assertParticipant(record, userId)
  return sortMessages(record.messages)
}

export async function createConversation(
  ownerId: string,
  employeeId: string,
): Promise<ConversationView> {
  const employee = await findEmployeeById(employeeId)
  if (!employee) throw new HttpError(400, "Assignee must be an existing employee.")

  const participantIds = [ownerId, employeeId].sort()
  const db = getAdapter()
  const records = await db.list(CONVERSATIONS_COLLECTION)
  const existing = records.find(
    (record) =>
      fromRecord(record).participantIds.length === 2 &&
      participantIds.every((id) => fromRecord(record).participantIds.includes(id)),
  )
  if (existing) return toView(fromRecord(existing))

  const conversation: ConversationRecord = {
    id: generateId("conv"),
    participantIds,
    messages: [],
  }
  await db.set(CONVERSATIONS_COLLECTION, conversation.id, { ...conversation })
  return toView(conversation)
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<ChatMessage> {
  const record = await findRecord(conversationId)
  if (!record) throw new HttpError(404, "Conversation not found.")
  assertParticipant(record, senderId)

  const recipientId = record.participantIds.find((id) => id !== senderId)
  if (!recipientId) throw new HttpError(400, "Conversation has no recipient.")

  const now = new Date().toISOString()
  const message: ChatMessage = {
    id: generateId("msg"),
    conversationId,
    senderId,
    recipientId,
    content,
    createdAt: now,
  }
  record.messages.push(message)
  record.lastMessageAt = now

  const db = getAdapter()
  await db.set(CONVERSATIONS_COLLECTION, conversationId, { ...record })
  return message
}

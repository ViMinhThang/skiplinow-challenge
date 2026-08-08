import { Router } from "express"

import { HttpError } from "../errors/http-error.js"
import { getAuthUser, requireAuth } from "../middleware/require-auth.js"
import {
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "../services/conversations.js"
import { emitChatMessage, emitConversationCreated } from "../sockets/chat-events.js"
import { parseBody } from "../utils/parse.js"
import {
  createConversationSchema,
  messageContentSchema,
} from "../validation/schemas.js"

export const conversationsRouter: Router = Router()

conversationsRouter.use(requireAuth())

conversationsRouter.get("/", async (req, res) => {
  res.json(await listConversations(getAuthUser(req).id))
})

conversationsRouter.post("/", requireAuth("owner"), async (req, res) => {
  const { participantIds } = parseBody(req.body, createConversationSchema)
  const user = getAuthUser(req)
  const employeeId = participantIds.find((id) => id !== user.id)
  if (employeeId === undefined) {
    throw new HttpError(400, "A conversation needs exactly two participants.")
  }
  const conversation = await createConversation(user.id, employeeId)
  emitConversationCreated(conversation.id, conversation.participantIds)
  res.status(201).json(conversation)
})

conversationsRouter.get("/:id/messages", async (req, res) => {
  res.json(await getMessages(String(req.params.id ?? ""), getAuthUser(req).id))
})

conversationsRouter.post("/:id/messages", async (req, res) => {
  const conversationId = String(req.params.id ?? "")
  const sender = getAuthUser(req)
  const { content } = parseBody(req.body, messageContentSchema)
  const message = await sendMessage(conversationId, sender.id, content)
  emitChatMessage(conversationId, sender.id, message.recipientId, message)
  res.status(201).json(message)
})

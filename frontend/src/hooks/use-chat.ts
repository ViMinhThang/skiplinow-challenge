"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useInvalidatingMutation } from "@/hooks/use-invalidating-mutation"
import {
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "@/services/chat"
import type { ConversationView } from "@/types"

export const CHAT_POLL_INTERVAL = 2000

const CONVERSATIONS_KEY = ["conversations"] as const

function messagesKey(conversationId: string) {
  return ["messages", conversationId] as const
}

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => listConversations(userId as string),
    enabled: Boolean(userId),
    refetchInterval: CHAT_POLL_INTERVAL,
  })
}

export function useMessages(
  conversationId?: string | null,
  userId?: string | null,
) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? ""),
    queryFn: () => getMessages(conversationId as string, userId as string),
    enabled: Boolean(conversationId && userId),
    refetchInterval: CHAT_POLL_INTERVAL,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      conversationId,
      senderId,
      content,
    }: {
      conversationId: string
      senderId: string
      content: string
    }) => sendMessage(conversationId, senderId, content),
    onSuccess: (_message, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) })
    },
  })
}

export function useCreateConversation() {
  return useInvalidatingMutation<
    { ownerId: string; employeeId: string },
    ConversationView
  >(CONVERSATIONS_KEY, ({ ownerId, employeeId }) =>
    createConversation(ownerId, employeeId),
  )
}

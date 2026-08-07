"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useInvalidatingMutation } from "@/hooks/use-invalidating-mutation"
import {
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "@/services/chat"
import { useAuthStore } from "@/stores/auth"
import { disconnectChatSocket, getChatSocket } from "@/lib/socket"
import type { ChatMessage, ConversationView } from "@/types"

const CONVERSATIONS_KEY = ["conversations"] as const

function messagesKey(conversationId: string) {
  return ["messages", conversationId] as const
}

interface ChatMessagePayload {
  conversationId?: string
  message?: ChatMessage
}

export function useChatRealtime(): void {
  const token = useAuthStore((state) => state.session?.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) {
      disconnectChatSocket()
      return
    }
    const socket = getChatSocket(token)

    const handleMessage = (payload: ChatMessagePayload) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
      if (payload?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: messagesKey(payload.conversationId),
        })
      }
    }
    const handleNewConversation = () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    }

    socket.on("chat:message", handleMessage)
    socket.on("chat:new", handleNewConversation)
    return () => {
      socket.off("chat:message", handleMessage)
      socket.off("chat:new", handleNewConversation)
    }
  }, [token, queryClient])
}

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => listConversations(),
    enabled: Boolean(userId),
  })
}

export function useMessages(
  conversationId?: string | null,
  userId?: string | null,
) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? ""),
    queryFn: () => getMessages(conversationId as string),
    enabled: Boolean(conversationId && userId),
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string
      content: string
    }) => sendMessage(conversationId, content),
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

"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { ConversationList } from "@/components/chat/conversation-list"
import { ConversationThread } from "@/components/chat/conversation-thread"
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog"
import { Button } from "@/components/ui/button"
import {
  useChatRealtime,
  useConversations,
  useMessages,
} from "@/hooks/use-chat"
import { useEmployees } from "@/hooks/use-employees"
import { getLastReadAt, markConversationRead } from "@/lib/chat-read-state"
import { useCurrentUser } from "@/stores/auth"
import type { ConversationView } from "@/types"

function nowIso(): string {
  return new Date().toISOString()
}

export function ChatShell({ canStart }: { canStart: boolean }) {
  const user = useCurrentUser()
  useChatRealtime()
  const employeesQuery = useEmployees()
  const conversationsQuery = useConversations(user?.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const conversations = conversationsQuery.data ?? []
  const selected =
    conversations.find((c) => c.id === selectedId) ?? null

  const messagesQuery = useMessages(selectedId, user?.id)

  const unreadCounts: Record<string, number> = {}
  if (user) {
    for (const conversation of conversations) {
      const lastReadAt = getLastReadAt(user.id, conversation.id)
      unreadCounts[conversation.id] = conversation.messages.filter(
        (message) =>
          message.senderId !== user.id &&
          (!lastReadAt || message.createdAt > lastReadAt),
      ).length
    }
  }

  const existingEmployeeIds: string[] = []
  if (user) {
    for (const conversation of conversations) {
      if (conversation.participants.length !== 2) continue
      const otherId = conversation.participants.find(
        (p) => p.id !== user.id,
      )?.id
      if (otherId) existingEmployeeIds.push(otherId)
    }
  }

  function handleSelect(conversation: ConversationView) {
    setSelectedId(conversation.id)
    if (user) markConversationRead(user.id, conversation.id, nowIso())
  }

  function handleCreated(conversation: ConversationView) {
    setSelectedId(conversation.id)
    if (user) markConversationRead(user.id, conversation.id, nowIso())
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col gap-4 md:flex-row">
      <div className="flex h-72 flex-col overflow-hidden rounded-xl bg-secondary md:h-auto md:w-80 md:shrink-0">
        <ConversationList
          conversations={conversationsQuery.data}
          currentUserId={user?.id ?? ""}
          selectedId={selectedId ?? undefined}
          unreadCounts={unreadCounts}
          isLoading={conversationsQuery.isLoading}
          isError={conversationsQuery.isError}
          error={conversationsQuery.error}
          headerAction={
            canStart ? (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setDialogOpen(true)}
                aria-label="New conversation"
              >
                <PlusIcon />
              </Button>
            ) : null
          }
          onSelect={handleSelect}
          onRetry={() => conversationsQuery.refetch()}
        />
      </div>

      <div className="min-h-72 flex-1 overflow-hidden rounded-xl bg-card shadow-sm">
        <ConversationThread
          conversation={selected}
          currentUserId={user?.id ?? ""}
          messages={messagesQuery.data}
          isLoading={messagesQuery.isLoading}
          isError={messagesQuery.isError}
          error={messagesQuery.error}
          onRetry={() => messagesQuery.refetch()}
        />
      </div>

      {canStart && user && (
        <NewConversationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          ownerId={user.id}
          employees={employeesQuery.data}
          existingEmployeeIds={existingEmployeeIds}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

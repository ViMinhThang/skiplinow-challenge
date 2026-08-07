"use client"

import { MessageSquareIcon, RefreshCwIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatClockTime, formatMonthDay } from "@/lib/date"
import { getErrorMessage, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ConversationView } from "@/types"

function formatConversationTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  return sameDay ? formatClockTime(iso) : formatMonthDay(iso)
}

interface ConversationListProps {
  conversations?: ConversationView[]
  currentUserId: string
  selectedId?: string
  unreadCounts: Record<string, number>
  isLoading: boolean
  isError: boolean
  error: unknown
  headerAction?: React.ReactNode
  onSelect: (conversation: ConversationView) => void
  onRetry: () => void
}

function otherParticipant(
  conversation: ConversationView,
  currentUserId: string,
) {
  return (
    conversation.participants.find((p) => p.id !== currentUserId) ??
    conversation.participants[0]
  )
}

function preview(conversation: ConversationView, currentUserId: string) {
  const last = conversation.messages[conversation.messages.length - 1]
  if (!last) return "No messages yet"
  return last.senderId === currentUserId ? `You: ${last.content}` : last.content
}

function LoadingList() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  unreadCounts,
  isLoading,
  isError,
  error,
  headerAction,
  onSelect,
  onRetry,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-semibold">Conversations</h2>
        {headerAction}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <LoadingList />}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCwIcon />
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && conversations?.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <MessageSquareIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No conversations yet.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          conversations?.map((conversation) => {
            const other = otherParticipant(conversation, currentUserId)
            const active = conversation.id === selectedId
            const unread = active ? 0 : (unreadCounts[conversation.id] ?? 0)
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelect(conversation)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  active && "bg-sidebar-accent hover:bg-sidebar-accent",
                )}
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>{initials(other?.name ?? "?")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {other?.name ?? "Unknown"}
                    </p>
                    {conversation.lastMessageAt && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatConversationTime(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {preview(conversation, currentUserId)}
                    </p>
                    {unread > 0 && (
                      <Badge className="shrink-0 bg-primary text-primary-foreground">
                        {unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
      </div>
    </div>
  )
}

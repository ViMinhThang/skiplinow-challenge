"use client"

import { useEffect, useRef, useState } from "react"
import {
  Loader2Icon,
  MessageSquareIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSendMessage } from "@/hooks/use-chat"
import { formatClockTime } from "@/lib/date"
import { getErrorMessage, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ChatMessage, ConversationView } from "@/types"

interface ConversationThreadProps {
  conversation?: ConversationView | null
  currentUserId: string
  messages?: ChatMessage[]
  isLoading: boolean
  isError: boolean
  error: unknown
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

function MessageBubble({
  message,
  mine,
}: {
  message: ChatMessage
  mine: boolean
}) {
  return (
    <div className={cn("flex gap-2", mine && "flex-row-reverse")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatClockTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function ConversationThread({
  conversation,
  currentUserId,
  messages,
  isLoading,
  isError,
  error,
  onRetry,
}: ConversationThreadProps) {
  const sendMutation = useSendMessage()
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const other = conversation
    ? otherParticipant(conversation, currentUserId)
    : null

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function handleSend(event: React.FormEvent) {
    event.preventDefault()
    if (!conversation || !draft.trim() || sendMutation.isPending) return
    const body = draft
    setDraft("")
    try {
      await sendMutation.mutateAsync({
        conversationId: conversation.id,
        senderId: currentUserId,
        content: body,
      })
    } catch (err) {
      setDraft(body)
      toast.error(getErrorMessage(err))
    }
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquareIcon className="size-10 text-muted-foreground" />
        <p className="text-sm font-medium">Select a conversation</p>
        <p className="text-xs text-muted-foreground">
          Choose a conversation from the list to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar className="size-9">
          <AvatarFallback>{initials(other?.name ?? "?")}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{other?.name ?? "Unknown"}</p>
          <p className="text-xs text-muted-foreground">Direct message</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCwIcon />
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && messages?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquareIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              mine={message.senderId === currentUserId}
            />
          ))}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t p-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          className="h-10 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sendMutation.isPending || !draft.trim()}
          aria-label="Send message"
        >
          {sendMutation.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

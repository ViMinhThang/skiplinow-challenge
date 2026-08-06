"use client"

import { ChatShell } from "@/components/chat/chat-shell"

export default function WorkspaceChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Message your manager in real time.
        </p>
      </div>
      <ChatShell canStart={false} />
    </div>
  )
}

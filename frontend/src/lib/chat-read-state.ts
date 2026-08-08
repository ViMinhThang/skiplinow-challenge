import { readStateSchema } from "@/lib/schemas"

const KEY = "Tasked.chat.readState"

type ReadState = Record<string, Record<string, string>>

function load(): ReadState {
  if (typeof window === "undefined") return {}
  try {
    const parsed = readStateSchema.safeParse(
      JSON.parse(window.localStorage.getItem(KEY) ?? "{}"),
    )
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

function save(state: ReadState): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(state))
}

export function getLastReadAt(
  userId: string,
  conversationId: string,
): string | null {
  return load()[userId]?.[conversationId] ?? null
}

export function markConversationRead(
  userId: string,
  conversationId: string,
  at: string,
): void {
  const state = load()
  state[userId] = { ...state[userId], [conversationId]: at }
  save(state)
}

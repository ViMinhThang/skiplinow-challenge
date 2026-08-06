"use client"

import {
  ClipboardListIcon,
  MessageSquareIcon,
  UserCogIcon,
} from "lucide-react"

import { RequireAuth } from "@/components/auth/require-auth"
import {
  AppSidebar,
  type AppNavItem,
} from "@/components/shell/app-sidebar"

const NAV_ITEMS: AppNavItem[] = [
  { label: "Tasks", href: "/workspace/tasks", icon: ClipboardListIcon },
  {
    label: "Profile",
    href: "/workspace/profile",
    icon: UserCogIcon,
    disabled: true,
  },
  { label: "Chat", href: "/workspace/chat", icon: MessageSquareIcon },
]

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth role="employee">
      <div className="flex h-screen overflow-hidden">
        <AppSidebar navItems={NAV_ITEMS} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </RequireAuth>
  )
}

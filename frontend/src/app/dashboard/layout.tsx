"use client"

import {
  ClipboardListIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react"

import { RequireAuth } from "@/components/auth/require-auth"
import {
  AppSidebar,
  type AppNavItem,
} from "@/components/shell/app-sidebar"

const NAV_ITEMS: AppNavItem[] = [
  { label: "Employees", href: "/dashboard/employees", icon: UsersIcon },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardListIcon },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquareIcon },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth role="owner">
      <div className="flex h-screen overflow-hidden">
        <AppSidebar navItems={NAV_ITEMS} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </RequireAuth>
  )
}

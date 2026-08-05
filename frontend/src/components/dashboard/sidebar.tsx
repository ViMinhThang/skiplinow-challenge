"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardListIcon,
  LogOutIcon,
  MessageSquareIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { initials } from "@/lib/format"
import { useAuthStore, useCurrentUser } from "@/stores/auth"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Employees", href: "/dashboard/employees", icon: UsersIcon },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquareIcon },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardListIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useCurrentUser()
  const logout = useAuthStore((state) => state.logout)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <WorkflowIcon className="size-5 text-primary" />
        <span className="font-heading text-sm font-semibold">TaskFlow</span>
        <span className="ml-auto">
          <ThemeToggle />
        </span>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === pathname
          return (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              className={cn(
                "justify-start",
                active &&
                  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
                item.disabled && "pointer-events-none opacity-50",
              )}
            >
              <Link href={item.href ?? "#"}>
                <item.icon className="size-4" />
                {item.label}
                {item.disabled && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Soon
                  </Badge>
                )}
              </Link>
            </Button>
          )
        })}
      </nav>

      <Separator />

      <div className="flex items-center gap-2 p-3">
        <Avatar className="size-8">
          <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">
            {user?.role}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Log out"
        >
          <LogOutIcon className="size-4" />
        </Button>
      </div>
    </aside>
  )
}

"use client"

import { UserCogIcon } from "lucide-react"

import { ProfileForm } from "@/components/profile/profile-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentUser } from "@/stores/auth"
import { initials } from "@/lib/format"

export default function WorkspaceProfilePage() {
  const user = useCurrentUser()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your personal details. Changes are saved to your account.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="size-12">
            <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCogIcon className="size-4 text-muted-foreground" />
              {user?.name}
            </CardTitle>
            <CardDescription>
              {user?.role === "owner" ? "Owner" : "Team member"} account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  )
}

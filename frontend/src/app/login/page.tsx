"use client"

import { redirect } from "next/navigation"
import { BriefcaseBusinessIcon } from "lucide-react"

import { EmployeeLoginForm } from "@/components/auth/employee-login-form"
import { LoginForm } from "@/components/auth/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/stores/auth"

export default function LoginPage() {
  const session = useAuthStore((state) => state.session)

  if (session) {
    redirect(session.user.role === "owner" ? "/dashboard" : "/workspace")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusinessIcon className="size-5" />
            TaskFlow sign in
          </CardTitle>
          <CardDescription>
            Sign in as an owner or an employee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owner">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="owner" className="flex-1">
                Owner
              </TabsTrigger>
              <TabsTrigger value="employee" className="flex-1">
                Employee
              </TabsTrigger>
            </TabsList>
            <TabsContent value="owner">
              <LoginForm />
            </TabsContent>
            <TabsContent value="employee">
              <EmployeeLoginForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}

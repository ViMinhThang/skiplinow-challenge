import type { z } from "zod"

import type {
  authSessionSchema,
  chatMessageSchema,
  conversationViewSchema,
  employeeSchema,
  loginResponseSchema,
  requestAccessCodeResultSchema,
  setupAccountResponseSchema,
  taskSchema,
  taskStatusSchema,
  userRoleSchema,
  userSchema,
  userUpdateResponseSchema,
  verifyAccessCodeResponseSchema,
  workScheduleDaySchema,
  workScheduleEntrySchema,
  workScheduleSchema,
} from "@/lib/schemas"

export type UserRole = z.infer<typeof userRoleSchema>

export type User = z.infer<typeof userSchema>

export type AuthSession = z.infer<typeof authSessionSchema>

export type RequestAccessCodeResponse = Omit<
  z.infer<typeof requestAccessCodeResultSchema>,
  "devCode"
>

/**
 * Result of requesting an access code. `devCode` is only populated in dev
 * mode (the real backend sends the code via SMS instead).
 */
export type RequestAccessCodeResult = z.infer<
  typeof requestAccessCodeResultSchema
>

export type VerifyAccessCodeResponse = z.infer<
  typeof verifyAccessCodeResponseSchema
>

export type LoginResponse = z.infer<typeof loginResponseSchema>

export type SetupAccountResponse = z.infer<typeof setupAccountResponseSchema>

export type UserUpdateResponse = z.infer<typeof userUpdateResponseSchema>

export type WorkScheduleDay = z.infer<typeof workScheduleDaySchema>

export type WorkScheduleEntry = z.infer<typeof workScheduleEntrySchema>

export type WorkSchedule = z.infer<typeof workScheduleSchema>

export type Employee = z.infer<typeof employeeSchema>

export type TaskStatus = z.infer<typeof taskStatusSchema>

export type Task = z.infer<typeof taskSchema>

export type ChatMessage = z.infer<typeof chatMessageSchema>

export type Conversation = Omit<
  z.infer<typeof conversationViewSchema>,
  "participants"
>

export type ConversationView = z.infer<typeof conversationViewSchema>

export type UserUpdateInput = Partial<Pick<User, "name" | "phone" | "email">>

export type EmployeeInput = {
  name: string
  email: string
  department: string
}

export type EmployeeUpdateInput = Partial<EmployeeInput>

export type TaskInput = {
  title: string
  description?: string
  assigneeId: string
  dueDate?: string
}

export type TaskUpdateInput = Partial<TaskInput> & {
  status?: TaskStatus
}

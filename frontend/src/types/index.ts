export type UserRole = "owner" | "employee"

export interface User {
  id: string
  role: UserRole
  name: string
  phone: string
  email?: string
  username?: string
}

export interface AuthSession {
  token: string
  user: User
}

export interface RequestAccessCodeResponse {
  message: string
  /** Whether the phone number is a registered owner. */
  verified?: boolean
}

export interface VerifyAccessCodeResponse extends AuthSession {
  message: string
}

export interface LoginResponse extends AuthSession {
  message: string
}

export interface SetupAccountResponse {
  message: string
}

export type WorkScheduleDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export interface WorkScheduleEntry {
  day: WorkScheduleDay
  start: string
  end: string
  enabled: boolean
}

export interface WorkSchedule {
  entries: WorkScheduleEntry[]
}

export interface Employee extends User {
  role: "employee"
  phone: string
  email: string
  accountSetup: boolean
  schedule: WorkSchedule
  createdAt: string
}

export type EmployeeInput = {
  name: string
  phone: string
  email: string
  role: string
}

export type EmployeeUpdateInput = Partial<Omit<EmployeeInput, "role">>

export type TaskStatus = "todo" | "in_progress" | "done"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assigneeId: string
  createdBy: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export type TaskInput = {
  title: string
  description?: string
  assigneeId: string
  dueDate?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  participantIds: string[]
  messages: ChatMessage[]
  lastMessageAt?: string
}

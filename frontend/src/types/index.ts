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

/**
 * Result of requesting an access code. `devCode` is only populated by the
 * in-browser mock (the real backend sends the code via SMS instead).
 */
export type RequestAccessCodeResult = RequestAccessCodeResponse & {
  devCode?: string
}

export interface VerifyAccessCodeResponse extends AuthSession {
  message: string
}

export interface LoginResponse extends AuthSession {
  message: string
}

export type UserUpdateInput = Partial<Pick<User, "name" | "phone" | "email">>

export interface UserUpdateResponse {
  user: User
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

export interface Employee {
  id: string
  name: string
  phone: string
  email: string
  /** Job title, e.g. "Developer". */
  role: string
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

export type EmployeeUpdateInput = Partial<EmployeeInput>

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

export type TaskUpdateInput = Partial<TaskInput> & {
  status?: TaskStatus
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

export interface ConversationParticipant {
  id: string
  name: string
}

export interface ConversationView extends Conversation {
  participants: ConversationParticipant[]
}

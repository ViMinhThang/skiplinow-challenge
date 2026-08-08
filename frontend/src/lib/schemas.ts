import { z } from "zod"

import { DAY_LONG } from "@/lib/schedule"

export const userRoleSchema = z.enum(["owner", "employee"])

export const userSchema = z.object({
  id: z.string(),
  role: userRoleSchema,
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  username: z.string().optional(),
})

export const authSessionSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export const requestAccessCodeResultSchema = z.object({
  message: z.string(),
  success: z.boolean().optional(),
  accessCode: z.string().optional(),
  verified: z.boolean().optional(),
  devCode: z.string().optional(),
})

export const verifyAccessCodeResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: userSchema,
  success: z.boolean().optional(),
})

export const loginResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: userSchema,
})

export const setupAccountResponseSchema = z.object({
  message: z.string(),
})

export const userUpdateResponseSchema = z.object({
  user: userSchema,
})

export const messageResponseSchema = z.object({
  message: z.string(),
})

export const resendInviteResultSchema = z.object({
  message: z.string(),
  devLink: z.string().optional(),
})

export const workScheduleDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])

export const workScheduleEntrySchema = z.object({
  day: workScheduleDaySchema,
  start: z.string(),
  end: z.string(),
  enabled: z.boolean(),
})

export const workScheduleSchema = z.object({
  entries: z.array(workScheduleEntrySchema),
})

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  role: z.string(),
  accountSetup: z.boolean(),
  schedule: workScheduleSchema,
  createdAt: z.string(),
})

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"])

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: taskStatusSchema,
  assigneeId: z.string(),
  createdBy: z.string(),
  dueDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const chatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export const conversationViewSchema = z.object({
  id: z.string(),
  participantIds: z.array(z.string()),
  messages: z.array(chatMessageSchema),
  lastMessageAt: z.string().optional(),
  participants: z.array(z.object({ id: z.string(), name: z.string() })),
})

export const persistedSessionSchema = z.object({
  state: z
    .object({ session: authSessionSchema.nullable().optional() })
    .optional(),
  session: authSessionSchema.nullable().optional(),
})

export const readStateSchema = z.record(z.string(), z.record(z.string(), z.string()))

export const phoneInputFormSchema = z.object({
  phone: z.string().trim().min(1, "Please enter your phone number."),
})

export const accessCodeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter the 6-digit access code."),
})

export const loginFormSchema = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .refine(
    (input) => input.username.trim().length > 0 && input.password.length > 0,
    { message: "Please enter your username and password." },
  )

export const setupFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match.",
  })

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  description: z.string().optional(),
  assigneeId: z.string().trim().min(1, "Please choose an assignee."),
  dueDate: z.string().optional(),
  status: taskStatusSchema.optional(),
})

export const employeeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Please enter a valid email address.",
    ),
  department: z.string().trim().min(1, "Department is required."),
})

export const profileFormSchema = z
  .object({
    name: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^\d{7,15}$/.test(value.replace(/\D/g, "")),
        "Phone number must contain 7–15 digits.",
      ),
    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "Please enter a valid email address.",
      ),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined))

export const scheduleFormSchema = z.object({
  entries: z
    .array(workScheduleEntrySchema)
    .superRefine((entries, ctx) => {
      entries.forEach((entry, index) => {
        if (entry.enabled && entry.start >= entry.end) {
          ctx.addIssue({
            code: "custom",
            message: `${DAY_LONG[entry.day]}: start time must be before end time.`,
            path: [index],
          })
        }
      })
    }),
})

export function formMessage(
  result: {
    success: boolean
    error?: { issues: ReadonlyArray<{ message: string }> }
  },
): string | null {
  if (result.success) return null
  return result.error?.issues[0]?.message ?? "Invalid input."
}

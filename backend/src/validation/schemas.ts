import { z } from "zod"

import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from "./constants.js"
import {
  defaultSchedule,
  isWorkScheduleDay,
  type WorkScheduleDay,
} from "../services/schedule.js"
import { isPhone, isTime } from "../utils/validation.js"

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required.")

const emailField = z.string().email("Please enter a valid email address.")

const phoneField = z
  .string()
  .trim()
  .refine(isPhone, "Phone number must contain 7–15 digits.")

const roleField = z
  .string()
  .trim()
  .min(1, "Role is required.")

export const phoneInputSchema = z.object({
  phone: z.string().trim().min(1),
})

export const verifyCodeSchema = z.object({
  phone: z.string().trim().min(1),
  code: z.string().trim().min(1),
})

export const emailInputSchema = z.object({
  email: emailField,
})

export const emailCodeSchema = z.object({
  email: emailField,
  code: z.string().trim().min(1),
})

export const setupSchema = z.object({
  token: z.string().trim().min(1),
  username: z
    .string()
    .trim()
    .regex(
      USERNAME_PATTERN,
      "Username must be 3–30 characters (letters, numbers, dot, dash, underscore).",
    ),
  password: z.string().min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  ),
})

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

export const patchMeSchema = z
  .object({
    name: nameField,
    phone: phoneField,
    email: emailField,
  })
  .partial()

export const createEmployeeSchema = z.object({
  name: nameField,
  email: emailField,
  department: z.string().trim().min(1, "Department is required."),
})

export const updateEmployeeSchema = z
  .object({
    name: nameField,
    phone: phoneField,
    email: emailField,
    role: roleField,
    department: z.string().trim().optional(),
  })
  .partial()

export const employeeIdSchema = z.object({
  employeeId: z.string().trim().min(1),
})

export const resendInviteSchema = z.object({
  action: z.literal("resend-invite", "Unknown action."),
})

export const scheduleEntrySchema = z.object({
  day: z.string().transform((day, ctx): WorkScheduleDay => {
    if (!isWorkScheduleDay(day)) {
      ctx.addIssue({ code: "custom", message: `Unknown day "${day}".` })
      return z.NEVER
    }
    return day
  }),
  start: z.string(),
  end: z.string(),
  enabled: z.boolean("Each day needs an enabled flag."),
})

export const scheduleInputSchema = z.object({
  entries: z
    .array(scheduleEntrySchema)
    .superRefine((entries, ctx) => {
      if (entries.length !== 7) {
        ctx.addIssue({
          code: "custom",
          message: "Schedule must include all 7 days.",
        })
        return
      }
      const seen = new Set<string>()
      entries.forEach((entry, index) => {
        if (seen.has(entry.day)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate day "${entry.day}".`,
            path: [index, "day"],
          })
        }
        seen.add(entry.day)
        if (entry.enabled) {
          if (!isTime(entry.start) || !isTime(entry.end)) {
            ctx.addIssue({
              code: "custom",
              message: "Work hours must use HH:MM format.",
              path: [index],
            })
          } else if (entry.start >= entry.end) {
            ctx.addIssue({
              code: "custom",
              message: `Start time must be before end time on ${entry.day}.`,
              path: [index],
            })
          }
        }
      })
    }),
})

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required."),
  description: z.string().trim().optional(),
  assigneeId: z.string().trim().min(1, "Please choose an assignee."),
  dueDate: z.string().trim().optional(),
})

const taskStatusSchema = z.enum(["todo", "in_progress", "done"], "Invalid status.")

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required."),
    description: z.string().trim(),
    assigneeId: z.string().trim().min(1, "Please choose an assignee."),
    dueDate: z.string().trim(),
    status: taskStatusSchema,
  })
  .partial()

export const taskRecordSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  description: z.string().optional().transform((value) => value || undefined),
  status: taskStatusSchema.default("todo"),
  assigneeId: z.string(),
  createdBy: z.string(),
  dueDate: z.string().optional().transform((value) => value || undefined),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
})

export const createConversationSchema = z.object({
  participantIds: z
    .array(z.string().trim().min(1))
    .length(2, "A conversation needs exactly two participants."),
})

export const messageContentSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty."),
})

export const chatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  content: z.string(),
  createdAt: z.string(),
})

export const conversationRecordSchema = z.object({
  id: z.string(),
  participantIds: z.array(z.string()).default([]),
  messages: z.array(chatMessageSchema).default([]),
  lastMessageAt: z.string().optional(),
})

export const ownerRecordSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  phone: z.string().default(""),
  phoneNormalized: z.string().default(""),
  role: z.literal("owner"),
  createdAt: z.string().default(() => new Date().toISOString()),
})

export const employeeRecordSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  phone: z.string().default(""),
  phoneNormalized: z.string().default(""),
  email: z.string().default(""),
  role: z.string().default(""),
  accountSetup: z.boolean().default(false),
  schedule: z
    .object({ entries: z.array(scheduleEntrySchema) })
    .default(() => defaultSchedule()),
  username: z.string().optional(),
  passwordHash: z.string().optional(),
  inviteTokenHash: z.string().optional(),
  inviteExpiresAt: z.coerce
    .number()
    .optional()
    .transform((value) => value || undefined),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
})

export const accessCodeRecordSchema = z.object({
  id: z.string(),
  codeHash: z.string(),
  attempts: z.number(),
  expiresAt: z.number(),
})

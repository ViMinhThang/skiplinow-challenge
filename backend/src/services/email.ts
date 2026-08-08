import nodemailer from "nodemailer"

import { config } from "../config.js"

export interface EmailResult {
  sent: boolean
  devLink?: string
}

function transporter() {
  if (!config.smtp.host) return null
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user
      ? { user: config.smtp.user, pass: config.smtp.pass }
      : undefined,
  })
}

async function send(
  to: string,
  subject: string,
  text: string,
  devLink?: string,
): Promise<EmailResult> {
  if (config.devMode) {
    console.log(`[email:dev] to ${to} â€” ${subject}\n${text}`)
    return { sent: false, ...(devLink ? { devLink } : {}) }
  }

  const client = transporter()
  if (!client) {
    return { sent: false, ...(devLink ? { devLink } : {}) }
  }

  await client.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
  })
  return { sent: true }
}

export function sendInviteEmail(
  to: string,
  name: string,
  token: string,
): Promise<EmailResult> {
  const link = `${config.appUrl}/setup?token=${token}`
  return send(
    to,
    "Set up your Tasked account",
    [
      `Hi ${name},`,
      "",
      "An account has been created for you on Tasked.",
      "Click the link below to choose your username and password:",
      "",
      link,
      "",
      "This link expires in 7 days.",
    ].join("\n"),
    link,
  )
}

export function sendAccessCodeEmail(
  to: string,
  code: string,
): Promise<EmailResult> {
  return send(
    to,
    "Your Tasked access code",
    `Your Tasked access code is ${code}. It expires in 10 minutes.`,
  )
}


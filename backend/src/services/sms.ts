import twilio from "twilio"

import { config } from "../config.js"

export interface SmsResult {
  sent: boolean
}

function twilioClient() {
  const { accountSid, authToken } = config.twilio
  if (!accountSid || !authToken) return null
  return twilio(accountSid, authToken)
}

export async function sendAccessCodeSms(
  phone: string,
  code: string,
): Promise<SmsResult> {
  const client = twilioClient()
  if (!client || !config.twilio.from) {
    if (config.devMode) {
      console.log(`[sms:dev] access code for ${phone}: ${code}`)
    }
    return { sent: false }
  }

  await client.messages.create({
    to: phone,
    from: config.twilio.from,
    body: `Your TaskFlow access code is ${code}. It expires in 10 minutes.`,
  })
  return { sent: true }
}


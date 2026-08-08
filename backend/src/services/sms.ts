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
  if (config.devMode) {
    console.log(`[sms:dev] access code for ${phone}: ${code}`)
    return { sent: false }
  }

  const client = twilioClient()
  if (!client || !config.twilio.from) {
    return { sent: false }
  }

  try {
    if (config.twilio.bodyTemplate) {
      // Trial accounts can only send predefined Twilio templates (e.g. sms_2fa).
      await client.messages.create({
        to: phone,
        from: config.twilio.from,
        body: config.twilio.bodyTemplate,
      })
    } else if (config.twilio.contentSid) {
      // Paid accounts: registered content template with a code variable ({{1}}).
      await client.messages.create({
        to: phone,
        from: config.twilio.from,
        contentSid: config.twilio.contentSid,
        contentVariables: JSON.stringify({ 1: code }),
      })
    } else {
      await client.messages.create({
        to: phone,
        from: config.twilio.from,
        body: `Your TaskFlow access code is ${code}. It expires in 10 minutes.`,
      })
    }
    return { sent: true }
  } catch (err) {
    console.error(
      `[sms] failed to send access code to ${phone} from ${config.twilio.from} (bodyTemplate: ${config.twilio.bodyTemplate || "none"}, contentSid: ${config.twilio.contentSid || "none"}):`,
      err,
    )
    return { sent: false }
  }
}

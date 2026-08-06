const port = Number(process.env.PORT ?? 4000)
const nodeEnv = process.env.NODE_ENV ?? "development"
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

export const config = {
  port,
  nodeEnv,
  corsOrigins,
  devMode: (process.env.DEV_MODE ?? "true") !== "false",
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "insecure-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    from: process.env.TWILIO_FROM ?? "",
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "TaskFlow <no-reply@example.com>",
  },
} as const

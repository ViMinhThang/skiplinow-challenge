import rateLimit from "express-rate-limit"

export const requestCodeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again in a minute." },
})

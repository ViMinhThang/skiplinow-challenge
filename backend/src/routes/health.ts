import { Router } from "express"

import { config } from "../config.js"
import { firebaseReady } from "../firebase.js"

export const healthRouter: Router = Router()

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "skiplinow-challenge-backend",
    firebase: firebaseReady(),
    mode: config.devMode ? "dev" : "production",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})


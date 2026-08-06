import "dotenv/config"

import { createApp } from "./app.js"
import { config } from "./config.js"
import { firebaseReady, initFirebase } from "./firebase.js"

initFirebase()

const app = createApp()
const server = app.listen(config.port, () => {
  console.log(
    `[server] listening on http://localhost:${config.port} (${config.devMode ? "dev mode" : "production"}, firebase: ${firebaseReady() ? "ready" : "not configured"})`,
  )
})

function shutdown(): void {
  server.close(() => process.exit(0))
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)


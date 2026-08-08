import "dotenv/config"

import { createServer } from "node:http"

import { createApp } from "./app.js"
import { config } from "./config.js"
import { firebaseReady, initFirebase } from "./firebase.js"
import { ensureOwner } from "./services/owners.js"
import { createChatSocket } from "./sockets/chat-socket.js"
import { attachSocketServer } from "./sockets/io.js"

initFirebase()
ensureOwner().catch((err) => {
  console.error("[seed] failed to ensure owner:", err)
})

const app = createApp()
const server = createServer(app)
attachSocketServer(createChatSocket(server))

server.listen(config.port, () => {
  console.log(
    `[server] listening on http://localhost:${config.port} (${config.devMode ? "dev mode" : "production"}, firebase: ${firebaseReady() ? "ready" : "not configured"})`,
  )
})

function shutdown(): void {
  server.close(() => process.exit(0))
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

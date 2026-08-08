import { readFileSync } from "node:fs"
import { applicationDefault, cert, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import type { App } from "firebase-admin/app"
import type { Firestore } from "firebase-admin/firestore"

import { config } from "./config.js"

let app: App | null = null
let db: Firestore | null = null

export function initFirebase(): void {
  if (app) return

  if (config.firebaseServiceAccount) {
    const raw = readFileSync(config.firebaseServiceAccount, "utf8")
    app = initializeApp({ credential: cert(JSON.parse(raw)) })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({ credential: applicationDefault() })
  } else {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.",
    )
  }
  db = getFirestore(app)
}

export function firebaseReady(): boolean {
  return db !== null
}

export function getFirestoreDb(): Firestore {
  if (!db) initFirebase()
  return db as Firestore
}

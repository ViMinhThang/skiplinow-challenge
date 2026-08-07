import { readFileSync } from "node:fs"
import { applicationDefault, cert, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import type { App } from "firebase-admin/app"
import type { Firestore } from "firebase-admin/firestore"

import { config } from "./config.js"

let app: App | null = null
let db: Firestore | null = null
let initError: string | null = null

export function initFirebase(): void {
  if (app) return
  try {
    if (config.firebaseServiceAccount) {
      const raw = readFileSync(config.firebaseServiceAccount, "utf8")
      app = initializeApp({ credential: cert(JSON.parse(raw)) })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({ credential: applicationDefault() })
    } else {
      initError =
        "Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS."
      return
    }
    db = getFirestore(app)
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err)
  }
}

export function firebaseReady(): boolean {
  return db !== null
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    initFirebase()
    if (!db) {
      throw new Error(initError ?? "Firebase is not initialized.")
    }
  }
  return db
}



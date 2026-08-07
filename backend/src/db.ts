import { getFirestoreDb, firebaseReady } from "./firebase.js"
import { config } from "./config.js"
import type { Firestore } from "firebase-admin/firestore"

export interface DocRecord {
  id: string
  [key: string]: unknown
}

export interface DbAdapter {
  list(collection: string): Promise<DocRecord[]>
  get(collection: string, id: string): Promise<DocRecord | null>
  set(collection: string, id: string, doc: DocRecord): Promise<void>
  update(
    collection: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<void>
  remove(collection: string, id: string): Promise<void>
}

function toRecord(id: string, data: Record<string, unknown>): DocRecord {
  return { id, ...data }
}

class FirestoreAdapter implements DbAdapter {
  private db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async list(collection: string): Promise<DocRecord[]> {
    const snapshot = await this.db.collection(collection).get()
    return snapshot.docs.map((doc) => toRecord(doc.id, doc.data()))
  }

  async get(collection: string, id: string): Promise<DocRecord | null> {
    const snapshot = await this.db.collection(collection).doc(id).get()
    if (!snapshot.exists) return null
    return toRecord(snapshot.id, snapshot.data() ?? {})
  }

  async set(collection: string, id: string, doc: DocRecord): Promise<void> {
    await this.db.collection(collection).doc(id).set({ ...doc })
  }

  async update(
    collection: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.db.collection(collection).doc(id).set(patch, { merge: true })
  }

  async remove(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete()
  }
}

class MemoryAdapter implements DbAdapter {
  private stores = new Map<string, Map<string, DocRecord>>()

  private store(collection: string): Map<string, DocRecord> {
    let store = this.stores.get(collection)
    if (!store) {
      store = new Map()
      this.stores.set(collection, store)
    }
    return store
  }

  async list(collection: string): Promise<DocRecord[]> {
    return [...this.store(collection).values()].map((doc) => ({ ...doc }))
  }

  async get(collection: string, id: string): Promise<DocRecord | null> {
    const doc = this.store(collection).get(id)
    return doc ? { ...doc } : null
  }

  async set(collection: string, id: string, doc: DocRecord): Promise<void> {
    this.store(collection).set(id, { ...doc })
  }

  async update(
    collection: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const store = this.store(collection)
    const existing = store.get(id) ?? { id }
    store.set(id, { ...existing, ...patch, id })
  }

  async remove(collection: string, id: string): Promise<void> {
    this.store(collection).delete(id)
  }
}

let memoryAdapter: MemoryAdapter | null = null

export function getAdapter(): DbAdapter {
  if (firebaseReady()) return new FirestoreAdapter(getFirestoreDb())
  if (config.devMode) {
    memoryAdapter ??= new MemoryAdapter()
    return memoryAdapter
  }
  throw new Error(
    "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.",
  )
}


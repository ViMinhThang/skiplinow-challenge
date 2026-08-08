import { getFirestoreDb } from "./firebase.js"
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

function withoutUndefined(doc: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(doc).filter(([, value]) => value !== undefined),
  )
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
    await this.db.collection(collection).doc(id).set(withoutUndefined({ ...doc }))
  }

  async update(
    collection: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.db.collection(collection).doc(id).set(withoutUndefined(patch), { merge: true })
  }

  async remove(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete()
  }
}

export function getAdapter(): DbAdapter {
  return new FirestoreAdapter(getFirestoreDb())
}

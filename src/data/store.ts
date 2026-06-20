// ════════════════════════════════════════════════════════════════
// THE STORE — one source of truth for every role.
//
// Data flow in one sentence:  a screen calls store.add/update/remove →
// the store mutates the DB and notifies listeners → every subscribed
// component re-renders with the new data. Same API whether the backend
// is the in-memory Mock (default) or real Firestore (flip a flag).
// ════════════════════════════════════════════════════════════════
import type { CollectionName, DB } from './types'
import { makeSeed } from './seed'
import { firebaseEnabled, db as fdb } from '../lib/firebase'
import { uid } from '../lib/format'

type Row = { id: string }

export interface DataStore {
  /** Current full DB snapshot (stable ref until something changes). */
  snapshot(): DB
  /** Subscribe to any change. Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void
  add<K extends CollectionName>(name: K, item: DB[K][number]): void
  update<K extends CollectionName>(name: K, id: string, patch: Partial<DB[K][number]>): void
  remove<K extends CollectionName>(name: K, id: string): void
  setAll<K extends CollectionName>(name: K, items: DB[K]): void
  /** Convenience: append an audit entry (id + ts filled in). */
  log(entry: { actor: string; role: DB['audit'][number]['role']; action: string }): void
  /** Restore the seed (and clear persistence). */
  reset(): void
}

// ── Shared base: holds the in-memory DB + listener fan-out ──────
abstract class BaseStore implements DataStore {
  protected data: DB
  private listeners = new Set<() => void>()

  constructor(initial: DB) {
    this.data = initial
  }

  // arrow-bound so they're stable references for useSyncExternalStore
  snapshot = (): DB => this.data
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  protected emit() {
    this.persist()
    this.listeners.forEach((l) => l())
  }

  /** Replace a collection with a NEW array so React detects the change. */
  protected commit<K extends CollectionName>(name: K, next: DB[K]) {
    this.data = { ...this.data, [name]: next } as DB
    this.emit()
  }

  add<K extends CollectionName>(name: K, item: DB[K][number]) {
    this.commit(name, [...(this.data[name] as Row[]), item] as DB[K])
    this.write(name, item as Row)
  }
  update<K extends CollectionName>(name: K, id: string, patch: Partial<DB[K][number]>) {
    const next = (this.data[name] as Row[]).map((r) => (r.id === id ? { ...r, ...patch } : r))
    this.commit(name, next as DB[K])
    const merged = (next as Row[]).find((r) => r.id === id)
    if (merged) this.write(name, merged)
  }
  remove<K extends CollectionName>(name: K, id: string) {
    this.commit(name, (this.data[name] as Row[]).filter((r) => r.id !== id) as DB[K])
    this.del(name, id)
  }
  setAll<K extends CollectionName>(name: K, items: DB[K]) {
    this.commit(name, items)
  }
  log(entry: { actor: string; role: DB['audit'][number]['role']; action: string }) {
    this.add('audit', { id: uid('au'), ts: Date.now(), ...entry })
  }
  abstract reset(): void

  // Backend hooks — Mock no-ops, Firestore overrides.
  protected persist() {}
  protected write(_name: CollectionName, _item: Row) {}
  protected del(_name: CollectionName, _id: string) {}
}

// ── Mock backend: localStorage-persisted, fully synchronous ─────
const LS_KEY = 'arunami-db-v1'

class MockStore extends BaseStore {
  constructor() {
    super(MockStore.load() ?? makeSeed())
  }
  static load(): DB | null {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? (JSON.parse(raw) as DB) : null
    } catch {
      return null
    }
  }
  protected persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.data))
    } catch {
      /* ignore quota errors in prototype */
    }
  }
  reset() {
    this.data = makeSeed()
    this.persist()
    // notify
    this.setAll('audit', this.data.audit)
  }
}

// ── Firestore backend: mirror via onSnapshot, write via SDK ─────
// Kept intentionally simple — this is the "flip VITE_USE_FIREBASE=true" path.
class FirestoreStore extends BaseStore {
  private cols: CollectionName[] = ['users', 'companies', 'investors', 'allocations', 'pnl', 'distributions', 'reports', 'documents', 'audit']
  private fs: typeof import('firebase/firestore') | null = null

  constructor() {
    // Start from an empty shell; live data arrives via onSnapshot.
    super({ users: [], companies: [], investors: [], allocations: [], pnl: [], distributions: [], reports: [], documents: [], audit: [] })
    void this.connect()
  }

  private async connect() {
    const fs = await import('firebase/firestore')
    this.fs = fs
    for (const name of this.cols) {
      fs.onSnapshot(fs.collection(fdb!, name), (snap) => {
        const items = snap.docs.map((d) => d.data()) as Row[]
        this.data = { ...this.data, [name]: items } as DB
        this.emit()
      })
    }
  }

  // Writes go straight to Firestore; onSnapshot brings them back into the mirror.
  protected write(name: CollectionName, item: Row) {
    if (!this.fs) return
    void this.fs.setDoc(this.fs.doc(fdb!, name, item.id), item as Record<string, unknown>, { merge: true })
  }
  protected del(name: CollectionName, id: string) {
    if (!this.fs) return
    void this.fs.deleteDoc(this.fs.doc(fdb!, name, id))
  }
  async reset() {
    const fs = this.fs ?? (await import('firebase/firestore'))
    const seed = makeSeed()
    const batch = fs.writeBatch(fdb!)
    for (const name of this.cols) {
      for (const item of seed[name] as Row[]) batch.set(fs.doc(fdb!, name, item.id), item as Record<string, unknown>)
    }
    await batch.commit()
  }
}

// One singleton, chosen by env. Everything imports THIS.
export const store: DataStore = firebaseEnabled ? new FirestoreStore() : new MockStore()

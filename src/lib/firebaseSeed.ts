// First-run helper for Firebase mode: write the seed data into Firestore and
// create matching Email/Password accounts so you can sign in immediately.
// Safe to re-run — existing accounts are skipped.
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { store } from '../data/store'
import { makeSeed } from '../data/seed'

export const DEMO_PASSWORD = 'arunami123'

export async function seedFirebase(): Promise<string> {
  if (!auth) throw new Error('Firebase tidak aktif (set VITE_USE_FIREBASE=true)')
  // 1) Firestore data (store.reset() batch-writes the seed in Firebase mode)
  await store.reset()
  // 2) Auth accounts (best-effort)
  let created = 0
  let existed = 0
  for (const u of makeSeed().users) {
    try {
      await createUserWithEmailAndPassword(auth, u.email, DEMO_PASSWORD)
      created++
    } catch {
      existed++ // already exists / weak-password / etc. — fine for a prototype
    }
  }
  try { await signOut(auth) } catch { /* ignore */ }
  return `Seed selesai — ${created} akun baru, ${existed} sudah ada. Password semua akun: ${DEMO_PASSWORD}`
}

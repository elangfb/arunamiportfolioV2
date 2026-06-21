// User provisioning service (P3). Admin creates accounts here.
// Firebase mode: calls the `createUser` Cloud Function (Admin SDK creates the
// Auth account + sets the role claim) and sends a password-setup email.
// Mock mode: just adds to the local store.
import { firebaseEnabled, firebaseApp, auth } from './firebase'
import { store } from '../data/store'
import { uid as genId } from './format'
import type { Role, User } from '../data/types'

export async function provisionUser(opts: { name: string; email: string; role: Role }): Promise<string> {
  if (firebaseEnabled && firebaseApp) {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    await httpsCallable(getFunctions(firebaseApp), 'createUser')({ name: opts.name, email: opts.email, role: opts.role })
    // Send a reset email so the new user sets their own password (Firebase sends it).
    if (auth) {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      try { await sendPasswordResetEmail(auth, opts.email) } catch { /* non-fatal */ }
    }
    return 'Akun dibuat — email untuk mengatur password telah dikirim.'
  }
  store.add('users', { id: genId('u'), name: opts.name.trim() || opts.email, email: opts.email, role: opts.role, status: 'active' })
  store.log({ actor: 'Admin', role: 'admin', action: `Membuat akun ${opts.role}: ${opts.email}` })
  return 'Akun dibuat (mock).'
}

export async function setUserActive(user: User, active: boolean): Promise<void> {
  if (firebaseEnabled && firebaseApp) {
    if (!user.uid) return
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    await httpsCallable(getFunctions(firebaseApp), 'setUserDisabled')({ uid: user.uid, disabled: !active })
    return
  }
  store.update('users', user.id, { status: active ? 'active' : 'inactive' })
}

// Auth — dual mode, chosen by `firebaseEnabled` (env).
//   • Mock:     pick a seeded user (zero setup).
//   • Firebase: real email/password via Firebase Auth; the signed-in account
//               is matched to an app `User` record (by email) from the store.
// Screens never change — they just read `useAuth().user`.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from '../data/types'
import { store } from '../data/store'
import { auth, firebaseEnabled } from '../lib/firebase'

const LS_USER = 'arunami-current-user'

interface AuthState {
  user: User | null
  mode: 'mock' | 'firebase'
  authedNoProfile: boolean // Firebase sign-in succeeded but no matching app user (needs seed)
  loginAs: (userId: string) => void
  loginWithEmail: (email: string, pw: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (firebaseEnabled) return null
    const id = localStorage.getItem(LS_USER)
    return id ? store.snapshot().users.find((u) => u.id === id) ?? null : null
  })
  const [authedNoProfile, setAuthedNoProfile] = useState(false)
  const emailRef = useRef<string | null>(null)

  useEffect(() => {
    if (firebaseEnabled && auth) {
      const recompute = () => {
        const email = emailRef.current
        if (!email) { setUser(null); setAuthedNoProfile(false); return }
        const u = store.snapshot().users.find((x) => x.email === email) ?? null
        setUser(u)
        setAuthedNoProfile(!u)
      }
      const unsubAuth = onAuthStateChanged(auth, (fb) => { emailRef.current = fb?.email ?? null; recompute() })
      const unsubStore = store.subscribe(recompute)
      return () => { unsubAuth(); unsubStore() }
    }
    // Mock: keep the cached user synced with its store record.
    return store.subscribe(() => {
      setUser((cur) => (cur ? store.snapshot().users.find((u) => u.id === cur.id) ?? cur : cur))
    })
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    mode: firebaseEnabled ? 'firebase' : 'mock',
    authedNoProfile,
    loginAs: (userId) => {
      const u = store.snapshot().users.find((x) => x.id === userId) ?? null
      if (u) localStorage.setItem(LS_USER, u.id)
      setUser(u)
    },
    loginWithEmail: async (email, pw) => {
      if (!auth) throw new Error('Firebase auth tidak aktif')
      await signInWithEmailAndPassword(auth, email.trim(), pw)
      // onAuthStateChanged resolves the user record.
    },
    logout: () => {
      if (firebaseEnabled && auth) void signOut(auth)
      localStorage.removeItem(LS_USER)
      emailRef.current = null
      setUser(null)
    },
  }), [user, authedNoProfile])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

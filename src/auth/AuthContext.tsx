// Lightweight auth for the prototype: pick a seeded user to "log in" as.
// The selected user (and role) drives routing + which data each screen sees.
// For real Firebase auth, swap `loginAs` for signInWithEmailAndPassword and
// resolve the user record by email — the rest of the app is unchanged.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../data/types'
import { store } from '../data/store'

const LS_USER = 'arunami-current-user'

interface AuthState {
  user: User | null
  loginAs: (userId: string) => void
  logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const id = localStorage.getItem(LS_USER)
    return id ? store.snapshot().users.find((u) => u.id === id) ?? null : null
  })

  // Keep the cached user in sync if the underlying record changes.
  useEffect(() => store.subscribe(() => {
    setUser((cur) => (cur ? store.snapshot().users.find((u) => u.id === cur.id) ?? cur : cur))
  }), [])

  const value = useMemo<AuthState>(() => ({
    user,
    loginAs: (userId) => {
      const u = store.snapshot().users.find((x) => x.id === userId) ?? null
      if (u) localStorage.setItem(LS_USER, u.id)
      setUser(u)
    },
    logout: () => {
      localStorage.removeItem(LS_USER)
      setUser(null)
    },
  }), [user])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

// Prototype login: pick a seeded user to enter as that role.
// (Real Firebase email/password auth is a documented swap — see README.)
import { Navigate } from 'react-router-dom'
import { useCollection } from '../data/useStore'
import { ROLE_CONFIG, ROLE_LABEL } from '../config/roles'
import { firebaseEnabled } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { Avatar } from '../components/ui'
import type { Role } from '../data/types'

const ROLES: Role[] = ['admin', 'bapm', 'investor']

export default function Login() {
  const { user, loginAs } = useAuth()
  const users = useCollection('users')
  if (user) return <Navigate to={ROLE_CONFIG[user.role].home} replace />

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy text-white text-xl font-bold mb-3">A</div>
          <h1 className="text-2xl font-bold text-ink">Arunami</h1>
          <p className="text-sm text-ink-soft mt-1">Investment Portfolio Platform — prototype</p>
          <p className="text-xs text-ink-faint mt-2">
            Mode: <span className="font-semibold">{firebaseEnabled ? 'Firebase' : 'Mock (local)'}</span> · pilih akun untuk masuk
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map((role) => (
            <div key={role} className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: ROLE_CONFIG[role].accent }} />
                <span className="text-sm font-semibold text-ink">{ROLE_LABEL[role]}</span>
              </div>
              <div className="space-y-2">
                {users.filter((u) => u.role === role).map((u) => (
                  <button key={u.id} onClick={() => loginAs(u.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-info hover:bg-blue-50/40 transition text-left">
                    <Avatar name={u.name} color={ROLE_CONFIG[role].accent} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink truncate">{u.name}</span>
                      <span className="block text-xs text-ink-faint truncate">{u.email}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-6">
          Semua peran berbagi satu data store — aksi di satu peran langsung terlihat di peran lain.
        </p>
      </div>
    </div>
  )
}

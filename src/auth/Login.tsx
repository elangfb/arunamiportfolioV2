// Login — dual mode. Mock: pick a seeded user. Firebase: email/password, with a
// one-click first-run "seed data + accounts" helper.
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCollection } from '../data/useStore'
import { ROLE_CONFIG, ROLE_LABEL } from '../config/roles'
import { firebaseEnabled } from '../lib/firebase'
import { DEMO_PASSWORD, seedFirebase } from '../lib/firebaseSeed'
import { makeSeed } from '../data/seed'
import { useAuth } from './AuthContext'
import { Avatar, Button, Field, Input, toast } from '../components/ui'
import type { Role } from '../data/types'

const ROLES: Role[] = ['admin', 'bapm', 'investor']

export default function Login() {
  const { user } = useAuth()
  if (user) return <Navigate to={ROLE_CONFIG[user.role].home} replace />

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy text-white text-xl font-bold mb-3">A</div>
          <h1 className="text-2xl font-bold text-ink">Arunami</h1>
          <p className="text-sm text-ink-soft mt-1">Investment Portfolio Platform — prototype</p>
          <p className="text-xs text-ink-faint mt-2">Mode: <span className="font-semibold">{firebaseEnabled ? 'Firebase' : 'Mock (local)'}</span></p>
        </div>
        {firebaseEnabled ? <FirebaseLogin /> : <MockLogin />}
        <p className="text-center text-xs text-ink-faint mt-6">Semua peran berbagi satu data store — aksi di satu peran langsung terlihat di peran lain.</p>
      </div>
    </div>
  )
}

function MockLogin() {
  const { loginAs } = useAuth()
  const users = useCollection('users')
  return (
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
                <span className="min-w-0"><span className="block text-sm font-medium text-ink truncate">{u.name}</span><span className="block text-xs text-ink-faint truncate">{u.email}</span></span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FirebaseLogin() {
  const { loginWithEmail, authedNoProfile } = useAuth()
  const [email, setEmail] = useState('admin@arunami.id')
  const [pw, setPw] = useState(DEMO_PASSWORD)
  const [busy, setBusy] = useState(false)

  async function signIn() {
    setBusy(true)
    try { await loginWithEmail(email, pw) } catch (e) { toast('Gagal masuk: ' + (e as Error).message) } finally { setBusy(false) }
  }
  async function seed() {
    setBusy(true)
    try { toast(await seedFirebase()) } catch (e) { toast('Seed gagal: ' + (e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="card space-y-3">
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Button variant="primary" className="w-full justify-center" disabled={busy} onClick={signIn}>Masuk</Button>
        {authedNoProfile && <p className="text-xs text-warn">Akun terautentikasi tapi belum ada data. Jalankan "Seed data + akun" di bawah.</p>}
      </div>

      {import.meta.env.DEV && (
      <div className="card">
        <div className="text-sm font-semibold text-ink mb-1">Setup pertama kali <span className="text-warn font-normal">(dev only)</span></div>
        <p className="text-xs text-ink-soft mb-3">Tulis data demo ke Firestore &amp; buat akun demo (password: <code>{DEMO_PASSWORD}</code>). Aman dijalankan ulang. Tombol ini tidak muncul di build produksi.</p>
        <Button className="w-full justify-center" disabled={busy} onClick={seed}>Seed data + akun demo</Button>
        <div className="mt-3 text-[11px] text-ink-faint">
          Akun demo:
          <ul className="mt-1 space-y-0.5">
            {makeSeed().users.map((u) => <li key={u.id}>{ROLE_LABEL[u.role]} — <span className="font-mono">{u.email}</span></li>)}
          </ul>
        </div>
      </div>
      )}
    </div>
  )
}

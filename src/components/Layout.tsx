// App shell: role-aware sidebar + topbar. Nav comes from config/roles.ts,
// so the menu always matches the routes.
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { ROLE_CONFIG, ROLE_LABEL } from '../config/roles'
import { store } from '../data/store'
import { Avatar, toast } from './ui'

export default function Layout() {
  const { user, logout, mode, emailVerified, resendVerification } = useAuth()
  const loc = useLocation()
  if (!user) return null
  const cfg = ROLE_CONFIG[user.role]

  // current page label for the topbar
  const current = [...cfg.nav].reverse().find((n) => loc.pathname === n.to || (n.to !== cfg.home && loc.pathname.startsWith(n.to)))
    ?? cfg.nav[0]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-60 bg-navy text-white flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg grid place-items-center font-bold" style={{ background: cfg.accent }}>A</span>
          <div>
            <div className="text-sm font-semibold leading-tight">Arunami</div>
            <div className="text-[11px] text-white/50">{cfg.label}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {cfg.nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === cfg.home}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-4 py-2 text-sm border-l-[3px] transition',
                isActive ? 'bg-white/10 border-blue-400 text-white' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white',
              )}>
              <span className="w-4 text-center opacity-80">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 flex items-center gap-2">
          <Avatar name={user.name} color="#ffffff" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user.name}</div>
            <div className="text-[10px] text-white/50">{ROLE_LABEL[user.role]}</div>
          </div>
          <button onClick={logout} title="Keluar" className="text-white/60 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10">Keluar</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-13 min-h-[52px] border-b border-gray-200 bg-white px-7 flex items-center gap-3">
          <span className="text-base font-semibold text-ink">{current.label}</span>
          <span className="flex-1" />
          {import.meta.env.DEV && (
            <button
              onClick={() => { store.reset(); toast('Data direset ke seed') }}
              className="text-xs text-ink-soft hover:text-ink px-2.5 py-1.5 rounded-md hover:bg-gray-50"
              title="Kembalikan data demo ke kondisi awal (dev only)">↻ Reset data</button>
          )}
        </header>
        {mode === 'firebase' && !emailVerified && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-7 py-2 flex items-center gap-3">
            <span>Email Anda belum diverifikasi.</span>
            <button className="underline font-medium"
              onClick={async () => { try { await resendVerification(); toast('Email verifikasi dikirim') } catch { toast('Gagal mengirim email') } }}>
              Kirim ulang
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-7 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// Per-role navigation & home. This drives BOTH the sidebar and the routes,
// so adding a page = add one line here + one <Route> in App.tsx.
import type { Role } from '../data/types'

export interface NavItem {
  to: string
  label: string
  icon: string // single-glyph hint, keeps the sidebar light & dependency-free
}

export interface RoleConfig {
  label: string
  home: string
  accent: string // sidebar accent per role, for instant visual orientation
  nav: NavItem[]
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  admin: {
    label: 'Admin Console',
    home: '/admin',
    accent: '#4338CA',
    nav: [
      { to: '/admin', label: 'Dashboard', icon: '◧' },
      { to: '/admin/users', label: 'Pengguna & akses', icon: '◔' },
      { to: '/admin/companies', label: 'Perusahaan', icon: '▥' },
      { to: '/admin/investors', label: 'Investor & KYC', icon: '◑' },
      { to: '/admin/distributions', label: 'Bagi hasil & transfer', icon: '◈' },
    ],
  },
  bapm: {
    label: 'BA-PM Platform',
    home: '/bapm',
    accent: '#0E7490',
    nav: [
      { to: '/bapm', label: 'Portfolio', icon: '▤' },
      { to: '/bapm/pnl', label: 'P&L aktual', icon: '▦' },
      { to: '/bapm/bagihasil', label: 'Bagi hasil', icon: '◈' },
      { to: '/bapm/distributions', label: 'Distribusi', icon: '⇄' },
      { to: '/bapm/reports', label: 'Laporan investor', icon: '▭' },
    ],
  },
  investor: {
    label: 'Investor Portal',
    home: '/investor',
    accent: '#A21CAF',
    nav: [
      { to: '/investor', label: 'Dashboard', icon: '◧' },
      { to: '/investor/distributions', label: 'Distribusi', icon: '◈' },
      { to: '/investor/reports', label: 'Laporan', icon: '▭' },
      { to: '/investor/performance', label: 'Performa', icon: '◢' },
    ],
  },
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  bapm: 'BA-PM',
  investor: 'Investor',
}

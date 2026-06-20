import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '../data/types'
import { ROLE_CONFIG } from '../config/roles'
import { useAuth } from './AuthContext'

/** Gate a route subtree to one role. Redirects to login or the user's home. */
export function RoleGuard({ role }: { role: Role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={ROLE_CONFIG[user.role].home} replace />
  return <Outlet />
}

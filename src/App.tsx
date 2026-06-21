// Central router — the whole app map on one screen. Add a page = add a <Route>
// here + a nav item in config/roles.ts. Each role's pages live in features/<role>/.
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RoleGuard } from './auth/RoleGuard'
import Layout from './components/Layout'
import Login from './auth/Login'
import { ROLE_CONFIG } from './config/roles'

// Admin
import AdminDashboard from './features/admin/Dashboard'
import Users from './features/admin/Users'
import Companies from './features/admin/Companies'
import Investors from './features/admin/Investors'
import AdminDistributions from './features/admin/Distributions'
// BA-PM
import Portfolios from './features/bapm/Portfolios'
import PnL from './features/bapm/PnL'
import BagiHasil from './features/bapm/BagiHasil'
import BapmDistributions from './features/bapm/Distributions'
import Reports from './features/bapm/Reports'
// Investor
import InvestorDashboard from './features/investor/Dashboard'
import InvestorDistributions from './features/investor/Distributions'
import InvestorReports from './features/investor/Reports'
import Performance from './features/investor/Performance'

function Home() {
  const { user } = useAuth()
  return <Navigate to={user ? ROLE_CONFIG[user.role].home : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<RoleGuard role="admin" />}>
          <Route element={<Layout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="companies" element={<Companies />} />
            <Route path="investors" element={<Investors />} />
            <Route path="distributions" element={<AdminDistributions />} />
          </Route>
        </Route>

        <Route path="/bapm" element={<RoleGuard role="bapm" />}>
          <Route element={<Layout />}>
            <Route index element={<Portfolios />} />
            <Route path="pnl" element={<PnL />} />
            <Route path="bagihasil" element={<BagiHasil />} />
            <Route path="distributions" element={<BapmDistributions />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>

        <Route path="/investor" element={<RoleGuard role="investor" />}>
          <Route element={<Layout />}>
            <Route index element={<InvestorDashboard />} />
            <Route path="distributions" element={<InvestorDistributions />} />
            <Route path="reports" element={<InvestorReports />} />
            <Route path="performance" element={<Performance />} />
          </Route>
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </AuthProvider>
  )
}

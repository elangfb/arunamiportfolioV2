// BA-PM → Portfolio: the companies assigned to this BA-PM. Reads the shared
// store, so anything Admin onboards shows up here immediately.
import { useAuth } from '../../auth/AuthContext'
import { useCollection } from '../../data/useStore'
import { capSum, fillPct, pnlDerived } from '../../data/calc'
import { rpB, rpJt } from '../../lib/format'
import { Card, EmptyState, HealthBadge } from '../../components/ui'

export default function Portfolios() {
  const { user } = useAuth()
  const companies = useCollection('companies').filter((c) => c.bapmId === user?.id)
  const allocations = useCollection('allocations')
  const pnl = useCollection('pnl')

  if (!companies.length) return <EmptyState title="Belum ada portfolio" desc="Admin belum menugaskan perusahaan ke Anda. Onboard perusahaan dari Admin lalu assign BA-PM." />

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Portfolio yang Anda kelola. Klik tab di sidebar untuk input P&amp;L, hitung bagi hasil, teruskan distribusi, dan terbitkan laporan.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {companies.map((c) => {
          const allocs = allocations.filter((a) => a.companyId === c.id)
          const latest = [...pnl.filter((p) => p.companyId === c.id)].sort((a, b) => b.ts - a.ts)[0]
          const net = latest ? pnlDerived(latest).net : null
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-semibold text-ink">{c.name}</div>
                  <div className="text-xs text-ink-faint">{c.code} · {c.industry} · {c.stage}</div>
                </div>
                <HealthBadge level={c.health} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Investasi" value={rpB(c.targetInvestmentB)} />
                <Mini label="Terisi" value={`${fillPct(c, allocs)}%`} sub={`${allocs.length} investor`} />
                <Mini label="Net profit terakhir" value={net != null ? rpJt(net) : '—'} sub={latest?.period ?? 'belum ada P&L'} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="stat-label">{label}</div>
      <div className="text-sm font-semibold text-ink mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-ink-faint">{sub}</div>}
    </div>
  )
}

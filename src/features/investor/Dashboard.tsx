// Investor → Dashboard: holdings + totals. Everything here is produced by Admin
// (cap table) and BA-PM (P&L, distributions) and read live from the one store.
import { useMyInvestor, investorRecords } from '../shared'
import { useCollection } from '../../data/useStore'
import { ownership } from '../../data/calc'
import { rpJt } from '../../lib/format'
import { Card, EmptyState, HealthBadge, StatCard } from '../../components/ui'

export default function InvestorDashboard() {
  const me = useMyInvestor()
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const distributions = useCollection('distributions')
  const pnl = useCollection('pnl')

  if (!me) return <EmptyState title="Profil investor belum tertaut" desc="Akun login belum cocok dengan data investor mana pun." />

  const myAllocs = allocations.filter((a) => a.investorId === me.id)
  const totalInvested = myAllocs.reduce((s, a) => s + a.nominalJt, 0)
  const records = investorRecords(me.id, distributions, companies, allocations, pnl)
  const totalReceived = records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amountJt, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total nilai investasi" value={rpJt(totalInvested)} sub={`${myAllocs.length} portofolio aktif`} />
        <StatCard label="Total distribusi diterima" value={rpJt(totalReceived)} sub={`sejak ${me.joinedAt}`} tone="up" />
        <StatCard label="Portofolio" value={myAllocs.length} sub="holding aktif" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Portofolio saya</h2>
        {myAllocs.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myAllocs.map((a) => {
              const c = companies.find((x) => x.id === a.companyId)
              if (!c) return null
              const own = ownership(a, allocations.filter((x) => x.companyId === c.id))
              const received = records.filter((r) => r.company.id === c.id && r.status === 'paid').reduce((s, r) => s + r.amountJt, 0)
              return (
                <Card key={a.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div><div className="text-base font-semibold text-ink">{c.name}</div><div className="text-xs text-ink-faint">{c.code} · {c.industry}</div></div>
                    <HealthBadge level={c.health} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><div className="stat-label">Porsi saya</div><div className="font-semibold mt-0.5">{(own * 100).toFixed(1)}%</div></div>
                    <div><div className="stat-label">Nilai pokok</div><div className="font-semibold mt-0.5">{rpJt(a.nominalJt)}</div></div>
                    <div><div className="stat-label">Diterima</div><div className="font-semibold mt-0.5 text-ok">{rpJt(received)}</div></div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : <EmptyState title="Belum ada holding" desc="Anda belum dialokasikan ke portofolio mana pun." />}
      </div>
    </div>
  )
}

// Admin dashboard — platform-wide snapshot. Pure reads from the store.
import { useCollection } from '../../data/useStore'
import { Card, HealthBadge, StatCard } from '../../components/ui'
import { rpB } from '../../lib/format'
import type { HealthLevel } from '../../data/types'

const HEALTH_ORDER: HealthLevel[] = ['siaga3', 'siaga2', 'siaga1', 'sehat']

export default function Dashboard() {
  const companies = useCollection('companies')
  const investors = useCollection('investors')
  const distributions = useCollection('distributions')
  const audit = useCollection('audit')

  const activeAum = companies.filter((c) => c.status === 'active').reduce((s, c) => s + c.targetInvestmentB, 0)
  const pendingKyc = investors.filter((i) => i.kyc === 'pending').length
  const pendingDist = distributions.filter((d) => d.status === 'pending').length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="AUM aktif" value={rpB(activeAum)} sub={`${companies.filter((c) => c.status === 'active').length} portfolio aktif`} />
        <StatCard label="Perusahaan" value={companies.length} sub={`${companies.filter((c) => c.status !== 'active').length} dalam onboarding`} />
        <StatCard label="Investor" value={investors.length} sub={`${pendingKyc} menunggu KYC`} tone={pendingKyc ? 'down' : 'neutral'} />
        <StatCard label="Bagi hasil pending" value={pendingDist} sub="perlu diproses" tone={pendingDist ? 'down' : 'up'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold mb-3">Sebaran kesehatan portfolio</h2>
          <div className="space-y-2.5">
            {HEALTH_ORDER.map((lvl) => {
              const list = companies.filter((c) => c.health === lvl)
              return (
                <div key={lvl} className="flex items-center justify-between">
                  <HealthBadge level={lvl} />
                  <span className="text-xs text-ink-soft truncate ml-3">{list.map((c) => c.name).join(', ') || '—'}</span>
                  <span className="text-sm font-semibold tabular-nums ml-3">{list.length}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Aktivitas terbaru</h2>
          <div className="space-y-2.5">
            {[...audit].sort((a, b) => b.ts - a.ts).slice(0, 6).map((a) => (
              <div key={a.id} className="flex gap-2.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-info mt-2 flex-shrink-0" />
                <span>
                  <span className="text-ink">{a.action}</span>
                  <span className="block text-[11px] text-ink-faint">{a.actor} · {a.role}</span>
                </span>
              </div>
            ))}
            {!audit.length && <div className="text-xs text-ink-faint">Belum ada aktivitas.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}

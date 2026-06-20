// Investor → Performa: company financials (read-only), published by BA-PM.
import { useMyInvestor } from '../shared'
import { useCollection } from '../../data/useStore'
import { pnlDerived } from '../../data/calc'
import { rpJt } from '../../lib/format'
import { Card, EmptyState } from '../../components/ui'

export default function Performance() {
  const me = useMyInvestor()
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const pnl = useCollection('pnl')

  if (!me) return <EmptyState title="Profil investor belum tertaut" />
  const myCompanyIds = allocations.filter((a) => a.investorId === me.id).map((a) => a.companyId)
  const myCompanies = companies.filter((c) => myCompanyIds.includes(c.id))

  if (!myCompanies.length) return <EmptyState title="Belum ada holding" />

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Kinerja perusahaan diterbitkan oleh pengelola. Distribusi Anda dihitung dari kinerja ini sesuai skema bagi hasil.</p>
      {myCompanies.map((c) => {
        const rows = [...pnl.filter((p) => p.companyId === c.id)].sort((a, b) => b.ts - a.ts)
        return (
          <Card key={c.id}>
            <h2 className="text-sm font-semibold mb-3">{c.name} <span className="text-xs text-ink-faint font-normal">· {c.industry}</span></h2>
            {rows.length ? (
              <table className="w-full text-sm">
                <thead className="text-ink-faint text-[11px] uppercase"><tr><th className="text-left py-1.5">Periode</th><th className="text-right py-1.5">Revenue</th><th className="text-right py-1.5">Gross</th><th className="text-right py-1.5">Net profit</th></tr></thead>
                <tbody>
                  {rows.map((p) => {
                    const d = pnlDerived(p)
                    return (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="py-2">{p.period}</td>
                        <td className="py-2 text-right tabular-nums">{rpJt(p.revenue)}</td>
                        <td className="py-2 text-right tabular-nums">{rpJt(d.gross)}</td>
                        <td className="py-2 text-right tabular-nums font-medium text-ok">{rpJt(d.net)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : <div className="text-sm text-ink-faint py-3 text-center">Belum ada data kinerja yang diterbitkan.</div>}
          </Card>
        )
      })}
    </div>
  )
}

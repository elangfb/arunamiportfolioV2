// BA-PM → Bagi hasil: preview the per-investor split for any company+period
// using the SAME calc engine the distributions use. Read-only insight tool.
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useCollection } from '../../data/useStore'
import { computeDistribution, pnlDerived } from '../../data/calc'
import { rpJt } from '../../lib/format'
import { Avatar, Card, EmptyState, Field, Select } from '../../components/ui'

export default function BagiHasil() {
  const { user } = useAuth()
  const companies = useCollection('companies').filter((c) => c.bapmId === user?.id)
  const allocations = useCollection('allocations')
  const investors = useCollection('investors')
  const pnl = useCollection('pnl')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')

  const company = companies.find((c) => c.id === companyId)
  const periods = [...pnl.filter((p) => p.companyId === companyId)].sort((a, b) => b.ts - a.ts)
  const [period, setPeriod] = useState(periods[0]?.period ?? '')

  if (!companies.length) return <EmptyState title="Belum ada portfolio" />

  const fin = pnl.find((p) => p.companyId === companyId && p.period === period)
  const allocs = allocations.filter((a) => a.companyId === companyId)
  const calc = company ? computeDistribution(company.scheme, allocs, { revenue: fin?.revenue ?? 0, net: fin ? pnlDerived(fin).net : 0 }) : null

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Field label="Portfolio"><Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPeriod('') }}>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Periode"><Select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="">— pilih periode —</option>{periods.map((p) => <option key={p.id} value={p.period}>{p.period}</option>)}</Select></Field>
      </div>

      {company && (
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-ink-faint mb-1">Skema bagi hasil — sesuai kontrak</div>
          <div className="text-sm text-ink">{company.scheme.basis}</div>
          <div className="text-xs text-ink-faint mt-1">Tipe {company.scheme.type} · {company.scheme.frequency} · fee platform 12%</div>
        </Card>
      )}

      {!period ? (
        <EmptyState title="Pilih periode" desc="Pilih periode dengan data P&L untuk menghitung distribusi." />
      ) : !fin ? (
        <EmptyState title="Belum ada P&L" desc={`Belum ada data P&L untuk ${period}. Input dulu di tab P&L aktual.`} />
      ) : calc && (
        <Card>
          <p className="text-sm text-ink-soft mb-3">Pool {rpJt(calc.pool)} − fee {rpJt(calc.fee)} = <strong>{rpJt(calc.net)}</strong> dibagi ke {calc.rows.length} investor</p>
          <table className="w-full text-sm">
            <thead className="text-ink-faint text-[11px] uppercase"><tr><th className="text-left py-2">Investor</th><th className="text-right py-2">% milik</th><th className="text-right py-2">Bagi hasil</th></tr></thead>
            <tbody>
              {calc.rows.map((r) => {
                const inv = investors.find((i) => i.id === r.investorId)
                return (
                  <tr key={r.investorId} className="border-t border-gray-100">
                    <td className="py-2"><div className="flex items-center gap-2"><Avatar name={inv?.name ?? '?'} color="#A21CAF" />{inv?.name}</div></td>
                    <td className="py-2 text-right tabular-nums">{r.ownershipPct}%</td>
                    <td className="py-2 text-right tabular-nums font-medium text-ok">{rpJt(r.amountJt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-[11px] text-ink-faint mt-3">Distribusi aktual dibuat &amp; diproses oleh Admin (Bagi hasil &amp; transfer), lalu diteruskan ke investor di tab Distribusi.</p>
        </Card>
      )}
    </div>
  )
}

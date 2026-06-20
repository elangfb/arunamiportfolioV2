// BA-PM → P&L aktual: manual monthly entry. Writing here populates the shared
// store → Investor performance/reports read from it (fixes the V2 "empty portal").
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useActor } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { pnlDerived } from '../../data/calc'
import { rpJt, uid } from '../../lib/format'
import { Button, Card, EmptyState, Field, Input, Select, toast } from '../../components/ui'

export default function PnL() {
  const { user } = useAuth()
  const actor = useActor()
  const companies = useCollection('companies').filter((c) => c.bapmId === user?.id)
  const pnl = useCollection('pnl')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const blank = { period: '', revenue: '', cogs: '', opex: '', depreciation: '', financeCost: '' }
  const [f, setF] = useState<Record<keyof typeof blank, string>>(blank)
  const set = (k: keyof typeof blank, v: string) => setF((s) => ({ ...s, [k]: v }))

  if (!companies.length) return <EmptyState title="Belum ada portfolio" />

  const n = (v: string) => Number(v) || 0
  const preview = pnlDerived({ id: '', companyId, period: '', ts: 0, revenue: n(f.revenue), cogs: n(f.cogs), opex: n(f.opex), depreciation: n(f.depreciation), financeCost: n(f.financeCost) })
  const history = [...pnl.filter((p) => p.companyId === companyId)].sort((a, b) => b.ts - a.ts)

  function save() {
    if (!f.period.trim()) { toast('Isi periode dulu'); return }
    const ts = Number(f.period.replace(/\D/g, '')) || Date.now()
    store.add('pnl', { id: uid('p'), companyId, period: f.period.trim(), ts, revenue: n(f.revenue), cogs: n(f.cogs), opex: n(f.opex), depreciation: n(f.depreciation), financeCost: n(f.financeCost) })
    const c = companies.find((x) => x.id === companyId)
    store.log({ actor: actor.name, role: 'bapm', action: `Input P&L ${c?.name} ${f.period}` })
    toast('Data P&L tersimpan'); setF(blank)
  }

  return (
    <div className="space-y-4">
      <Field label="Portfolio"><Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="max-w-xs">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold mb-3">Input bulan baru</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Periode"><Input value={f.period} onChange={(e) => set('period', e.target.value)} placeholder="Nov 2024" /></Field>
            <div />
            <Field label="Revenue (juta)"><Input type="number" value={f.revenue} onChange={(e) => set('revenue', e.target.value)} /></Field>
            <Field label="COGS / HPP (juta)"><Input type="number" value={f.cogs} onChange={(e) => set('cogs', e.target.value)} /></Field>
            <Field label="OpEx (juta)"><Input type="number" value={f.opex} onChange={(e) => set('opex', e.target.value)} /></Field>
            <Field label="Depresiasi (juta)"><Input type="number" value={f.depreciation} onChange={(e) => set('depreciation', e.target.value)} /></Field>
            <Field label="Finance cost (juta)"><Input type="number" value={f.financeCost} onChange={(e) => set('financeCost', e.target.value)} /></Field>
          </div>
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-3 gap-2">
            <div><div className="stat-label">Gross</div><div className="font-semibold">{rpJt(preview.gross)}</div></div>
            <div><div className="stat-label">Operating</div><div className="font-semibold">{rpJt(preview.operating)}</div></div>
            <div><div className="stat-label">Net profit</div><div className="font-semibold text-ok">{rpJt(preview.net)}</div></div>
          </div>
          <div className="flex gap-2 mt-4"><Button onClick={() => setF(blank)}>Reset</Button><Button variant="primary" className="flex-1" onClick={save}>Simpan data</Button></div>
          <p className="text-[11px] text-ink-faint mt-2">Phase 2: upload PDF/Excel + ekstraksi AI akan menggantikan input manual ini.</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Riwayat P&amp;L</h2>
          {history.length ? (
            <table className="w-full text-sm">
              <thead className="text-ink-faint text-[11px] uppercase"><tr><th className="text-left py-1.5">Periode</th><th className="text-right py-1.5">Revenue</th><th className="text-right py-1.5">Net</th><th /></tr></thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2">{p.period}</td>
                    <td className="py-2 text-right tabular-nums">{rpJt(p.revenue)}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{rpJt(pnlDerived(p).net)}</td>
                    <td className="py-2 text-right"><button className="text-danger text-xs hover:underline" onClick={() => store.remove('pnl', p.id)}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="text-sm text-ink-faint py-4 text-center">Belum ada data P&L untuk portfolio ini.</div>}
        </Card>
      </div>
    </div>
  )
}

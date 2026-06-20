// BA-PM → Laporan investor: draft → publish. Published reports land in the
// shared store and appear in every investor's portal for that company.
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useActor } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { pnlDerived } from '../../data/calc'
import { today, uid } from '../../lib/format'
import { rpJt } from '../../lib/format'
import { Button, Card, EmptyState, Field, Input, Pill, Select, Textarea, toast } from '../../components/ui'
import type { Report } from '../../data/types'

export default function Reports() {
  const { user } = useAuth()
  const actor = useActor()
  const companies = useCollection('companies').filter((c) => c.bapmId === user?.id)
  const pnl = useCollection('pnl')
  const reports = useCollection('reports')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [period, setPeriod] = useState('')
  const [kind, setKind] = useState<'monthly' | 'quarterly'>('monthly')
  const [body, setBody] = useState('')

  if (!companies.length) return <EmptyState title="Belum ada portfolio" />

  const company = companies.find((c) => c.id === companyId)
  const periods = [...pnl.filter((p) => p.companyId === companyId)].sort((a, b) => b.ts - a.ts)
  const published = reports.filter((r) => r.companyId === companyId)

  function prefill() {
    const fin = pnl.find((p) => p.companyId === companyId && p.period === period)
    const net = fin ? rpJt(pnlDerived(fin).net) : '—'
    setBody(`Laporan kinerja ${company?.name} — periode ${period || '...'}\n\nRevenue: ${fin ? rpJt(fin.revenue) : '—'} · Net profit: ${net}.\nDistribusi bagi hasil dihitung sesuai skema kontrak dan diteruskan beserta bukti transfer.\n\nHormat kami,\nTim Arunami`)
  }

  function publish() {
    if (!period.trim()) { toast('Pilih periode'); return }
    const r: Report = { id: uid('r'), companyId, investorId: null, period: period.trim(), kind, status: 'published', body: body.trim() || `Laporan ${period}`, publishedAt: today(), reads: {} }
    store.add('reports', r)
    store.log({ actor: actor.name, role: 'bapm', action: `Publish laporan ${company?.name} ${period} ke semua investor` })
    toast('Laporan diterbitkan'); setBody(''); setPeriod('')
  }

  return (
    <div className="space-y-4">
      <Field label="Portfolio"><Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPeriod('') }} className="max-w-xs">{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold mb-3">Buat laporan</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Periode">
              <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="">— pilih —</option>
                {periods.map((p) => <option key={p.id} value={p.period}>{p.period}</option>)}
              </Select>
            </Field>
            <Field label="Jenis"><Select value={kind} onChange={(e) => setKind(e.target.value as 'monthly' | 'quarterly')}><option value="monthly">Bulanan</option><option value="quarterly">Kuartalan</option></Select></Field>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="field-label !mb-0">Isi laporan</span>
            <button className="text-xs text-info hover:underline" onClick={prefill}>Isi dari data platform</button>
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tulis laporan, atau klik 'Isi dari data platform'…" rows={7} />
          <p className="text-[11px] text-ink-faint mt-1">Phase 2: draft AI (dari data platform / dokumen brand) menggantikan penulisan manual.</p>
          <div className="flex justify-end mt-3"><Button variant="primary" onClick={publish}>Publish ke semua investor</Button></div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">Laporan terbit</h2>
          {published.length ? (
            <div className="space-y-2">
              {[...published].reverse().map((r) => (
                <div key={r.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <div><div className="text-sm font-medium">Laporan {r.period}</div><div className="text-[11px] text-ink-faint">{r.kind === 'monthly' ? 'Bulanan' : 'Kuartalan'} · {r.publishedAt}</div></div>
                  <Pill tone="green">Published</Pill>
                </div>
              ))}
            </div>
          ) : <div className="text-sm text-ink-faint py-4 text-center">Belum ada laporan terbit untuk portfolio ini.</div>}
        </Card>
      </div>
    </div>
  )
}

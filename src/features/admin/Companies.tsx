// Admin → Perusahaan: list companies, onboard new ones, manage cap tables.
// Writes flow into the shared store and are instantly visible to BA-PM & Investor.
import { useState } from 'react'
import { useActor } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { capSum, fillPct, ownership } from '../../data/calc'
import { rpB, rpJt, uid } from '../../lib/format'
import { Avatar, Button, Card, Field, HealthBadge, Input, Modal, Pill, Select, toast } from '../../components/ui'
import type { Company, SchemeType } from '../../data/types'

const STATUS_TONE = { active: 'green', onboarding: 'blue', prospect: 'amber', closed: 'gray' } as const

export default function Companies() {
  const actor = useActor()
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [capId, setCapId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Onboard perusahaan, tetapkan skema bagi hasil, dan kelola cap table investor.</p>
        <Button variant="primary" onClick={() => setOnboardOpen(true)}>+ Onboard perusahaan</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-faint text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Perusahaan</th>
              <th className="text-left font-semibold px-4 py-2.5">Industri</th>
              <th className="text-left font-semibold px-4 py-2.5">Terisi / target</th>
              <th className="text-left font-semibold px-4 py-2.5">Health</th>
              <th className="text-left font-semibold px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const allocs = allocations.filter((a) => a.companyId === c.id)
              const filled = fillPct(c, allocs)
              return (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{c.name}</div>
                    <div className="text-xs text-ink-faint">{c.code} · {c.legalName}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.industry}<div className="text-xs text-ink-faint">{c.stage}</div></td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{rpJt(capSum(allocs))} <span className="text-ink-faint text-xs">/ {c.targetInvestmentB} M</span></div>
                    <div className="h-1.5 rounded-full bg-gray-100 mt-1 w-32 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: Math.min(100, filled) + '%', background: filled > 100 ? '#DC2626' : filled >= 100 ? '#059669' : '#2563EB' }} />
                    </div>
                    <div className="text-[11px] text-ink-faint mt-0.5">{filled}% · {allocs.length} investor</div>
                  </td>
                  <td className="px-4 py-3"><HealthBadge level={c.health} /></td>
                  <td className="px-4 py-3"><Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    <Button sm onClick={() => setCapId(c.id)}>Cap table</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {onboardOpen && <OnboardModal onClose={() => setOnboardOpen(false)} actor={actor} />}
      {capId && <CapTableModal companyId={capId} onClose={() => setCapId(null)} actor={actor} />}
    </div>
  )
}

// ── Onboard a company ──────────────────────────────────────────
function OnboardModal({ onClose, actor }: { onClose: () => void; actor: { name: string } }) {
  const users = useCollection('users')
  const bapm = users.find((u) => u.role === 'bapm')
  const [f, setF] = useState({
    name: '', legalName: '', industry: 'Fintech', stage: 'Series A',
    targetInvestmentB: 10, feePct: 2, schemeType: 'fixed' as SchemeType, ratePct: 10, frequency: 'monthly' as 'monthly' | 'quarterly', principalReturn: true,
  })
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }))

  function save() {
    const name = f.name.trim() || 'Perusahaan Baru'
    const code = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() + '-' + String(Math.floor(Math.random() * 900 + 100))
    const company: Company = {
      id: uid('c'), name, code, legalName: f.legalName.trim() || 'PT ' + name,
      industry: f.industry, stage: f.stage, targetInvestmentB: Number(f.targetInvestmentB) || 0, feePct: Number(f.feePct) || 0,
      status: 'active', health: 'sehat', bapmId: bapm?.id ?? null, principalReturn: f.principalReturn,
      scheme: { type: f.schemeType, ratePct: Number(f.ratePct) || 0, frequency: f.frequency, capPct: null, minPct: f.schemeType === 'fixed' ? Number(f.ratePct) : null, basis: `${f.ratePct}% — ${f.schemeType}` },
    }
    store.add('companies', company)
    store.log({ actor: actor.name, role: 'admin', action: `Onboarding perusahaan ${name} (skema ${f.schemeType})` })
    toast('Perusahaan ditambahkan'); onClose()
  }

  return (
    <Modal open title="Onboard perusahaan portfolio" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama merek"><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Cth: Cendana Tech" /></Field>
        <Field label="Badan hukum (PT)"><Input value={f.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="PT ..." /></Field>
        <Field label="Industri"><Input value={f.industry} onChange={(e) => set('industry', e.target.value)} /></Field>
        <Field label="Tahap"><Input value={f.stage} onChange={(e) => set('stage', e.target.value)} /></Field>
        <Field label="Target investasi (IDR M)"><Input type="number" value={f.targetInvestmentB} onChange={(e) => set('targetInvestmentB', e.target.value)} /></Field>
        <Field label="Fee platform (%)"><Input type="number" step="0.1" value={f.feePct} onChange={(e) => set('feePct', e.target.value)} /></Field>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mt-4 mb-2">Skema bagi hasil</div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipe">
          <Select value={f.schemeType} onChange={(e) => set('schemeType', e.target.value)}>
            <option value="fixed">Fixed return</option>
            <option value="revenue">Revenue sharing</option>
            <option value="profit">Profit sharing</option>
            <option value="blended">Blended</option>
          </Select>
        </Field>
        <Field label="Rate (%)"><Input type="number" step="0.1" value={f.ratePct} onChange={(e) => set('ratePct', e.target.value)} /></Field>
        <Field label="Frekuensi">
          <Select value={f.frequency} onChange={(e) => set('frequency', e.target.value)}>
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Triwulanan</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-ink-soft">
        <input type="checkbox" checked={f.principalReturn} onChange={(e) => set('principalReturn', e.target.checked)} />
        Ada pengembalian pokok di akhir kontrak
      </label>
      <div className="flex gap-2 mt-5">
        <Button onClick={onClose}>Batal</Button>
        <Button variant="primary" className="flex-1" onClick={save}>Onboard</Button>
      </div>
    </Modal>
  )
}

// ── Cap table editor ───────────────────────────────────────────
function CapTableModal({ companyId, onClose, actor }: { companyId: string; onClose: () => void; actor: { name: string } }) {
  const company = useCollection('companies').find((c) => c.id === companyId)!
  const investors = useCollection('investors')
  const allocs = useCollection('allocations').filter((a) => a.companyId === companyId)
  const verified = investors.filter((i) => i.kyc === 'verified' && !allocs.some((a) => a.investorId === i.id))
  const [pick, setPick] = useState('')
  const [nominal, setNominal] = useState('')

  function add() {
    const inv = investors.find((i) => i.id === pick) ?? verified[0]
    if (!inv) return
    store.add('allocations', { id: uid('a'), companyId, investorId: inv.id, nominalJt: Number(nominal) || 0 })
    store.log({ actor: actor.name, role: 'admin', action: `Menambah ${inv.name} ke cap table ${company.name}` })
    setPick(''); setNominal('')
  }

  return (
    <Modal open wide title={`Cap table — ${company.name}`} onClose={onClose}>
      <p className="text-xs text-ink-soft mb-3">Target {company.targetInvestmentB} M · terisi {rpJt(capSum(allocs))} ({fillPct(company, allocs)}%). Porsi dihitung otomatis dari nominal.</p>

      <div className="flex items-end gap-2 bg-gray-50 p-3 rounded-lg mb-3">
        <div className="flex-1">
          <Field label="Tambah investor (KYC verified)">
            <Select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">{verified.length ? '— pilih investor —' : 'semua investor sudah dialokasikan'}</option>
              {verified.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.type}</option>)}
            </Select>
          </Field>
        </div>
        <div className="w-32"><Field label="Nominal (juta)"><Input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="0" /></Field></div>
        <Button variant="primary" disabled={!verified.length} onClick={add}>Tambah</Button>
      </div>

      {allocs.length ? (
        <table className="w-full text-sm">
          <thead className="text-ink-faint text-[11px] uppercase">
            <tr><th className="text-left py-2">Investor</th><th className="text-right py-2">Nominal</th><th className="text-right py-2">% milik</th><th /></tr>
          </thead>
          <tbody>
            {allocs.map((a) => {
              const inv = investors.find((i) => i.id === a.investorId)
              return (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="py-2"><div className="flex items-center gap-2"><Avatar name={inv?.name ?? '?'} color="#A21CAF" />{inv?.name}</div></td>
                  <td className="py-2 text-right tabular-nums">{rpJt(a.nominalJt)}</td>
                  <td className="py-2 text-right tabular-nums">{(ownership(a, allocs) * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right"><button className="text-danger text-xs hover:underline" onClick={() => store.remove('allocations', a.id)}>Hapus</button></td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-gray-200 font-semibold">
              <td className="py-2">Total</td><td className="py-2 text-right tabular-nums">{rpJt(capSum(allocs))}</td><td className="py-2 text-right">{fillPct(company, allocs)}%</td><td />
            </tr>
          </tbody>
        </table>
      ) : <div className="text-sm text-ink-faint py-4 text-center">Belum ada investor di cap table.</div>}

      <div className="flex justify-end mt-5"><Button variant="primary" onClick={onClose}>Selesai</Button></div>
    </Modal>
  )
}

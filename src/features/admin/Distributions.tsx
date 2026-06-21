// Admin → Bagi hasil & transfer: create a batch, compute the split (calc engine),
// upload per-investor proof, then report to BA-PM. Status: pending → reported.
import { useState } from 'react'
import { useActor, distAmounts } from '../shared'
import { processDistribution } from '../../lib/money'
import { uploadFile } from '../../lib/storage'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { rpJt, uid } from '../../lib/format'
import { Avatar, Button, Card, Field, FileButton, Input, Modal, Pill, Select, StatCard, toast } from '../../components/ui'
import type { Distribution, DistributionStatus } from '../../data/types'

const STATUS: Record<DistributionStatus, { tone: 'amber' | 'blue' | 'green' | 'red'; label: string }> = {
  pending: { tone: 'amber', label: 'Perlu diproses' },
  reported: { tone: 'blue', label: 'Dilaporkan ke BA-PM' },
  forwarded: { tone: 'green', label: 'Diteruskan ke investor' },
  held: { tone: 'red', label: 'Ditahan' },
}

export default function AdminDistributions() {
  const actor = useActor()
  const distributions = useCollection('distributions')
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const pnl = useCollection('pnl')
  const [createOpen, setCreateOpen] = useState(false)
  const [processId, setProcessId] = useState<string | null>(null)

  const byStatus = (s: DistributionStatus) => distributions.filter((d) => d.status === s).length

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
        <strong>Alur:</strong> Admin hitung &amp; upload bukti → lapor ke BA-PM → BA-PM teruskan ke investor.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Perlu diproses" value={byStatus('pending')} tone={byStatus('pending') ? 'down' : 'neutral'} />
        <StatCard label="Dilaporkan ke BA-PM" value={byStatus('reported')} />
        <StatCard label="Sudah ke investor" value={byStatus('forwarded')} tone="up" />
        <StatCard label="Ditahan" value={byStatus('held')} tone={byStatus('held') ? 'down' : 'neutral'} />
      </div>

      <div className="flex justify-end"><Button variant="primary" onClick={() => setCreateOpen(true)}>+ Buat batch baru</Button></div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-faint text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Portfolio</th>
              <th className="text-left font-semibold px-4 py-2.5">Periode</th>
              <th className="text-right font-semibold px-4 py-2.5">Total bagi hasil</th>
              <th className="text-left font-semibold px-4 py-2.5">Bukti</th>
              <th className="text-left font-semibold px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {distributions.map((d) => {
              const company = companies.find((c) => c.id === d.companyId)
              if (!company) return null
              const calc = distAmounts(d, company, allocations, pnl)
              const proofCount = Object.values(d.proofs).filter((p) => p.file).length
              return (
                <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3"><div className="font-medium text-ink">{company.name}</div><div className="text-xs text-ink-faint">{company.code}</div></td>
                  <td className="px-4 py-3 text-ink-soft tabular-nums">{d.period}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{rpJt(calc.net)}</td>
                  <td className="px-4 py-3 text-xs">{proofCount ? <span className="text-ok">✓ {proofCount}/{calc.rows.length}</span> : <span className="text-ink-faint">—</span>}</td>
                  <td className="px-4 py-3"><Pill tone={STATUS[d.status].tone}>{STATUS[d.status].label}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    {d.status === 'pending'
                      ? <Button sm variant="primary" onClick={() => setProcessId(d.id)}>Proses &amp; upload bukti</Button>
                      : <Button sm onClick={() => setProcessId(d.id)}>Detail</Button>}
                  </td>
                </tr>
              )
            })}
            {!distributions.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-faint text-sm">Belum ada batch distribusi.</td></tr>}
          </tbody>
        </table>
      </Card>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} actor={actor} />}
      {processId && <ProcessModal distId={processId} onClose={() => setProcessId(null)} actor={actor} />}
    </div>
  )
}

function CreateModal({ onClose, actor }: { onClose: () => void; actor: { name: string } }) {
  const companies = useCollection('companies').filter((c) => c.status === 'active')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [period, setPeriod] = useState('Nov 2024')
  const [yieldPct, setYieldPct] = useState('7')
  function save() {
    const d: Distribution = { id: uid('d'), companyId, period: period.trim(), status: 'pending', yieldPct: Number(yieldPct) || 0, proofs: {}, createdAt: period }
    store.add('distributions', d)
    store.log({ actor: actor.name, role: 'admin', action: `Membuat batch bagi hasil ${period}` })
    toast('Batch dibuat'); onClose()
  }
  return (
    <Modal open title="Buat batch bagi hasil" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Portfolio"><Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Periode"><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Nov 2024" /></Field>
          <Field label="Yield realisasi (%)"><Input type="number" step="0.1" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex gap-2 mt-5"><Button onClick={onClose}>Batal</Button><Button variant="primary" className="flex-1" onClick={save}>Buat batch</Button></div>
    </Modal>
  )
}

function ProcessModal({ distId, onClose, actor }: { distId: string; onClose: () => void; actor: { name: string } }) {
  const dist = useCollection('distributions').find((d) => d.id === distId)!
  const company = useCollection('companies').find((c) => c.id === dist.companyId)!
  const investors = useCollection('investors')
  const allocations = useCollection('allocations')
  const pnl = useCollection('pnl')
  const calc = distAmounts(dist, company, allocations, pnl)
  const readOnly = dist.status !== 'pending'
  const [proofs, setProofs] = useState<Record<string, { file: string; url?: string }>>(() => {
    const init: Record<string, { file: string; url?: string }> = {}
    calc.rows.forEach((r) => { const ex = dist.proofs[r.investorId]; init[r.investorId] = ex?.file ? { file: ex.file, url: ex.url } : { file: '' } })
    return init
  })

  async function uploadProof(investorId: string, file: File) {
    setProofs((p) => ({ ...p, [investorId]: { file: 'Mengunggah…' } }))
    try {
      const res = await uploadFile(`proofs/${company.code}/${dist.period.replace(/\s/g, '')}`, file)
      setProofs((p) => ({ ...p, [investorId]: { file: res.name, url: res.url } }))
    } catch (e) { toast((e as Error).message); setProofs((p) => ({ ...p, [investorId]: { file: '' } })) }
  }

  async function report() {
    // Amounts are recomputed server-side (Firebase) or locally (mock) by the
    // money service — caller-supplied amounts are never trusted. We only pass proofs.
    if (!Object.values(proofs).some((p) => p.url)) { toast('Unggah minimal satu bukti transfer'); return }
    await processDistribution({ distId, proofs, actor: { name: actor.name, role: 'admin' } })
    toast('Diproses & dilaporkan ke BA-PM'); onClose()
  }
  function hold() { store.update('distributions', distId, { status: 'held' }); store.log({ actor: actor.name, role: 'admin', action: `Menahan bagi hasil ${company.name} ${dist.period}` }); toast('Bagi hasil ditahan'); onClose() }

  return (
    <Modal open wide title={readOnly ? 'Detail bagi hasil' : 'Proses bagi hasil & upload bukti'} onClose={onClose}>
      <p className="text-xs text-ink-soft mb-3">{company.name} · {dist.period} · skema {company.scheme.type} · pool {rpJt(calc.pool)} − fee {rpJt(calc.fee)} = <strong>{rpJt(calc.net)}</strong> untuk investor</p>
      <table className="w-full text-sm">
        <thead className="text-ink-faint text-[11px] uppercase"><tr><th className="text-left py-2">Investor</th><th className="text-right py-2">Bagi hasil</th><th className="text-left py-2 pl-4">Bukti transfer</th></tr></thead>
        <tbody>
          {calc.rows.map((r) => {
            const inv = investors.find((i) => i.id === r.investorId)
            return (
              <tr key={r.investorId} className="border-t border-gray-100">
                <td className="py-2"><div className="flex items-center gap-2"><Avatar name={inv?.name ?? '?'} color="#A21CAF" /><span>{inv?.name}<span className="block text-[11px] text-ink-faint">{r.ownershipPct}% milik</span></span></div></td>
                <td className="py-2 text-right tabular-nums font-medium text-ok">{rpJt(r.amountJt)}</td>
                <td className="py-2 pl-4">
                  {readOnly ? (
                    dist.proofs[r.investorId]?.url
                      ? <a className="text-xs text-info hover:underline" href={dist.proofs[r.investorId]!.url} target="_blank" rel="noreferrer">✓ {dist.proofs[r.investorId]?.file ?? 'bukti'}</a>
                      : <span className="text-xs text-ok">✓ {dist.proofs[r.investorId]?.file ?? '—'}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-soft">{proofs[r.investorId]?.file || 'Belum ada'}</span>
                      <FileButton label="Unggah" onPick={(f) => uploadProof(r.investorId, f)} />
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {readOnly ? (
        <div className="flex justify-end mt-5"><Button onClick={onClose}>Tutup</Button></div>
      ) : (
        <div className="flex gap-2 mt-5">
          <Button variant="danger" onClick={hold}>Tahan</Button>
          <Button variant="primary" className="flex-1" onClick={report}>Proses &amp; lapor ke BA-PM</Button>
        </div>
      )}
    </Modal>
  )
}

// Investor → Distribusi: history + proof viewer. Status comes straight from the
// shared distribution record (held / processing / paid) — trust by verification.
import { useState } from 'react'
import { useMyInvestor, investorRecords, type InvestorRecord } from '../shared'
import { useCollection } from '../../data/useStore'
import { rpJt } from '../../lib/format'
import { Button, Card, EmptyState, Modal, Pill } from '../../components/ui'

const STATUS = {
  paid: { tone: 'green', label: 'Dibayar' },
  processing: { tone: 'blue', label: 'Diproses' },
  held: { tone: 'red', label: 'Ditahan' },
} as const

export default function InvestorDistributions() {
  const me = useMyInvestor()
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const distributions = useCollection('distributions')
  const pnl = useCollection('pnl')
  const [proof, setProof] = useState<InvestorRecord | null>(null)

  if (!me) return <EmptyState title="Profil investor belum tertaut" />
  const records = investorRecords(me.id, distributions, companies, allocations, pnl)

  const paid = records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amountJt, 0)
  const proc = records.filter((r) => r.status === 'processing').reduce((s, r) => s + r.amountJt, 0)

  if (!records.length) return <EmptyState title="Belum ada distribusi" desc="Distribusi muncul setelah Admin memproses & BA-PM meneruskan bukti transfer." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4"><div className="stat-label">Sudah dibayar</div><div className="stat-value text-ok mt-1">{rpJt(paid)}</div></Card>
        <Card className="!p-4"><div className="stat-label">Sedang diproses</div><div className="stat-value text-info mt-1">{rpJt(proc)}</div></Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-faint text-[11px] uppercase tracking-wide">
            <tr><th className="text-left font-semibold px-4 py-2.5">Portofolio</th><th className="text-left font-semibold px-4 py-2.5">Periode</th><th className="text-right font-semibold px-4 py-2.5">Distribusi</th><th className="text-left font-semibold px-4 py-2.5">Status</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.dist.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                <td className="px-4 py-3"><div className="font-medium text-ink">{r.company.name}</div><div className="text-xs text-ink-faint">{r.company.code}</div></td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">{r.dist.period}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{r.status === 'held' ? '—' : rpJt(r.amountJt)}</td>
                <td className="px-4 py-3"><Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill></td>
                <td className="px-4 py-3 text-right">{r.status === 'paid' && <Button sm onClick={() => setProof(r)}>Bukti</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {proof && (
        <Modal open title="Bukti transfer distribusi" onClose={() => setProof(null)}>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="field-label">Portofolio</div>{proof.company.name}</div>
            <div><div className="field-label">Periode</div>{proof.dist.period}</div>
            <div><div className="field-label">Jumlah</div><span className="font-semibold text-ok">{rpJt(proof.amountJt)}</span></div>
            <div><div className="field-label">Status</div><Pill tone="green">Berhasil</Pill></div>
            <div className="col-span-2"><div className="field-label">File bukti</div>{me && proof.dist.proofs[me.id]?.file}</div>
          </div>
          <div className="flex gap-2 mt-5"><Button variant="primary" className="flex-1" onClick={() => setProof(null)}>Tutup</Button></div>
        </Modal>
      )}
    </div>
  )
}

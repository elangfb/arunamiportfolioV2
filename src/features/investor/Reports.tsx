// Investor → Laporan: published reports for the investor's holdings, with
// read/unread tracking written back to the shared report record.
import { useState } from 'react'
import { useMyInvestor } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { Button, Card, EmptyState, Modal, Pill } from '../../components/ui'
import type { Report } from '../../data/types'

export default function InvestorReports() {
  const me = useMyInvestor()
  const companies = useCollection('companies')
  const allocations = useCollection('allocations')
  const reports = useCollection('reports')
  const [open, setOpen] = useState<Report | null>(null)

  if (!me) return <EmptyState title="Profil investor belum tertaut" />
  const myCompanyIds = new Set(allocations.filter((a) => a.investorId === me!.id).map((a) => a.companyId))
  const mine = reports.filter((r) => r.status === 'published' && myCompanyIds.has(r.companyId))
  const unread = mine.filter((r) => !r.reads?.[me!.id]).length

  function openReport(r: Report) {
    setOpen(r)
    if (!r.reads?.[me!.id]) store.update('reports', r.id, { reads: { ...(r.reads ?? {}), [me!.id]: true } })
  }
  function markAll() {
    mine.forEach((r) => { if (!r.reads?.[me!.id]) store.update('reports', r.id, { reads: { ...(r.reads ?? {}), [me!.id]: true } }) })
  }

  if (!mine.length) return <EmptyState title="Belum ada laporan" desc="Laporan muncul setelah BA-PM menerbitkannya untuk portofolio Anda." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{mine.length} laporan · <span className="text-warn font-medium">{unread} belum dibaca</span></p>
        {unread > 0 && <Button sm onClick={markAll}>Tandai semua dibaca</Button>}
      </div>

      <Card className="!p-2">
        {[...mine].reverse().map((r) => {
          const c = companies.find((x) => x.id === r.companyId)
          const read = r.reads?.[me!.id]
          return (
            <button key={r.id} onClick={() => openReport(r)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">Laporan {r.period} — {c?.name}</div>
                <div className="text-[11px] text-ink-faint">Diterbitkan {r.publishedAt} · {r.kind === 'monthly' ? 'Bulanan' : 'Kuartalan'}</div>
              </div>
              <Pill tone={read ? 'green' : 'amber'}>{read ? 'Sudah dibaca' : 'Belum dibaca'}</Pill>
            </button>
          )
        })}
      </Card>

      {open && (
        <Modal open wide title={`Laporan ${open.period}`} onClose={() => setOpen(null)}>
          <div className="text-sm whitespace-pre-wrap leading-relaxed text-ink">{open.body}</div>
          <p className="text-[11px] text-ink-faint mt-4">Phase 2: tombol Unduh PDF (laporan ini print-to-PDF friendly).</p>
          <div className="flex justify-end mt-4"><Button variant="primary" onClick={() => setOpen(null)}>Tutup</Button></div>
        </Modal>
      )}
    </div>
  )
}

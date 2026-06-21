// Admin → Investor & KYC: registry + add + verification.
// Only verified investors can be added to a cap table (enforced in Companies).
import { useState } from 'react'
import { useActor } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { capSum } from '../../data/calc'
import { uploadFile } from '../../lib/storage'
import { rpJt, today, uid } from '../../lib/format'
import { Avatar, Button, Card, Field, FileButton, Input, Modal, Pill, Select, StatCard, toast } from '../../components/ui'
import type { Investor, KycStatus } from '../../data/types'

const KYC_TONE: Record<KycStatus, 'green' | 'amber' | 'red'> = { verified: 'green', pending: 'amber', rejected: 'red' }
const KYC_LABEL: Record<KycStatus, string> = { verified: 'Terverifikasi', pending: 'Pending', rejected: 'Ditolak' }

export default function Investors() {
  const actor = useActor()
  const investors = useCollection('investors')
  const allocations = useCollection('allocations')
  const [addOpen, setAddOpen] = useState(false)
  const [kycId, setKycId] = useState<string | null>(null)

  const verified = investors.filter((i) => i.kyc === 'verified').length
  const pending = investors.filter((i) => i.kyc === 'pending').length

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <strong>{pending} investor menunggu verifikasi KYC.</strong> Verifikasi diperlukan sebelum investor dapat dialokasikan & menerima distribusi.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total investor" value={investors.length} sub={`${verified} terverifikasi · ${pending} pending`} />
        <StatCard label="Total nominal tercatat" value={rpJt(allocations.reduce((s, a) => s + a.nominalJt, 0))} sub="di seluruh cap table" />
        <div className="flex items-end justify-end"><Button variant="primary" onClick={() => setAddOpen(true)}>+ Tambah investor</Button></div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-faint text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Investor</th>
              <th className="text-left font-semibold px-4 py-2.5">Tipe</th>
              <th className="text-left font-semibold px-4 py-2.5">NPWP</th>
              <th className="text-right font-semibold px-4 py-2.5">Holding</th>
              <th className="text-right font-semibold px-4 py-2.5">Total nominal</th>
              <th className="text-left font-semibold px-4 py-2.5">KYC</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {investors.map((i) => {
              const allocs = allocations.filter((a) => a.investorId === i.id)
              return (
                <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={i.name} color="#A21CAF" /><div><div className="font-medium text-ink">{i.name}</div><div className="text-xs text-ink-faint">{i.email}</div></div></div></td>
                  <td className="px-4 py-3 text-ink-soft capitalize">{i.type === 'individual' ? 'Individu' : 'Institusi'}</td>
                  <td className="px-4 py-3 text-ink-soft tabular-nums text-xs">{i.npwp ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{allocs.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{allocs.length ? rpJt(capSum(allocs)) : '—'}</td>
                  <td className="px-4 py-3"><Pill tone={KYC_TONE[i.kyc]}>{KYC_LABEL[i.kyc]}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    {i.kyc === 'pending'
                      ? <Button sm variant="primary" onClick={() => setKycId(i.id)}>Verifikasi</Button>
                      : <Button sm onClick={() => setKycId(i.id)}>Detail KYC</Button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {addOpen && <AddInvestorModal onClose={() => setAddOpen(false)} actor={actor} />}
      {kycId && <KycModal investorId={kycId} onClose={() => setKycId(null)} actor={actor} />}
    </div>
  )
}

function AddInvestorModal({ onClose, actor }: { onClose: () => void; actor: { name: string } }) {
  const [f, setF] = useState({ name: '', email: '', type: 'individual' as Investor['type'], npwp: '' })
  function save() {
    const inv: Investor = { id: uid('i'), name: f.name.trim() || 'Investor Baru', email: f.email.trim() || 'investor@email.com', type: f.type, npwp: f.npwp.trim() || undefined, kyc: 'pending', joinedAt: today() }
    store.add('investors', inv)
    store.log({ actor: actor.name, role: 'admin', action: `Mendaftarkan investor ${inv.name} (KYC pending)` })
    toast('Investor terdaftar — menunggu KYC'); onClose()
  }
  return (
    <Modal open title="Tambah investor" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nama lengkap"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Tipe"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Investor['type'] })}><option value="individual">Individu</option><option value="institution">Institusi</option></Select></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="NPWP (opsional)"><Input value={f.npwp} onChange={(e) => setF({ ...f, npwp: e.target.value })} /></Field>
      </div>
      <div className="flex gap-2 mt-5"><Button onClick={onClose}>Batal</Button><Button variant="primary" className="flex-1" onClick={save}>Daftarkan</Button></div>
    </Modal>
  )
}

const DOCS = [['ktp', 'KTP / identitas'], ['npwp', 'Kartu NPWP'], ['bank', 'Rekening bank']] as const

function KycModal({ investorId, onClose, actor }: { investorId: string; onClose: () => void; actor: { name: string } }) {
  const inv = useCollection('investors').find((i) => i.id === investorId)!
  async function uploadDoc(key: 'ktp' | 'npwp' | 'bank', file: File) {
    try {
      const res = await uploadFile(`kyc/${investorId}`, file)
      store.update('investors', investorId, { docs: { ...(inv.docs ?? {}), [key]: { name: res.name, url: res.url } } })
    } catch (e) { toast((e as Error).message) }
  }
  function verify() { store.update('investors', investorId, { kyc: 'verified' }); store.log({ actor: actor.name, role: 'admin', action: `Memverifikasi KYC ${inv.name}` }); toast('KYC terverifikasi'); onClose() }
  function reject() { store.update('investors', investorId, { kyc: 'rejected' }); store.log({ actor: actor.name, role: 'admin', action: `Menolak KYC ${inv.name}` }); toast('KYC ditolak'); onClose() }

  return (
    <Modal open title={inv.kyc === 'pending' ? 'Verifikasi KYC' : 'Detail KYC'} onClose={onClose}>
      <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm mb-4">
        <div><div className="field-label">Nama</div>{inv.name}</div>
        <div><div className="field-label">Email</div>{inv.email}</div>
        <div><div className="field-label">NPWP</div>{inv.npwp ?? '—'}</div>
        <div><div className="field-label">Terdaftar</div>{inv.joinedAt}</div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">Dokumen KYC (opsional)</div>
      <div className="space-y-2 mb-4">
        {DOCS.map(([key, label]) => {
          const file = inv.docs?.[key]
          return (
            <div key={key} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm">{label}{file && <a className="block text-xs text-info hover:underline" href={file.url} target="_blank" rel="noreferrer">✓ {file.name}</a>}</span>
              <FileButton label={file ? 'Ganti' : 'Unggah'} onPick={(f) => uploadDoc(key, f)} />
            </div>
          )
        })}
      </div>
      {inv.kyc === 'pending' ? (
        <div className="flex gap-2"><Button variant="danger" onClick={reject}>Tolak</Button><Button variant="primary" className="flex-1" onClick={verify}>Verifikasi & aktifkan</Button></div>
      ) : <div className="flex justify-end"><Button onClick={onClose}>Tutup</Button></div>}
    </Modal>
  )
}

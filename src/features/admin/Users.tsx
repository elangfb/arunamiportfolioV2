// Admin → Pengguna & akses (P3): provision accounts + enable/disable.
// New accounts get a password-setup email (Firebase mode); no shared password.
import { useState } from 'react'
import { useCollection } from '../../data/useStore'
import { provisionUser, setUserActive } from '../../lib/userAdmin'
import { ROLE_LABEL } from '../../config/roles'
import { Avatar, Button, Card, Field, Input, Modal, Pill, Select, toast } from '../../components/ui'
import type { Role } from '../../data/types'

export default function Users() {
  const users = useCollection('users')
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Kelola akun &amp; peran. Akun baru menerima email untuk mengatur password sendiri.</p>
        <Button variant="primary" onClick={() => setOpen(true)}>+ Tambah pengguna</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-ink-faint text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Pengguna</th>
              <th className="text-left font-semibold px-4 py-2.5">Peran</th>
              <th className="text-left font-semibold px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={u.name} /><div><div className="font-medium text-ink">{u.name}</div><div className="text-xs text-ink-faint">{u.email}</div></div></div></td>
                <td className="px-4 py-3 text-ink-soft">{ROLE_LABEL[u.role]}</td>
                <td className="px-4 py-3"><Pill tone={u.status === 'active' ? 'green' : u.status === 'pending' ? 'amber' : 'gray'}>{u.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <Button sm onClick={async () => { await setUserActive(u, u.status !== 'active'); toast('Status diperbarui') }}>
                    {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-faint text-sm">Belum ada pengguna.</td></tr>}
          </tbody>
        </table>
      </Card>

      {open && <AddUserModal onClose={() => setOpen(false)} />}
    </div>
  )
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'bapm' })
  const [busy, setBusy] = useState(false)
  async function save() {
    if (!f.email.trim()) { toast('Isi email'); return }
    setBusy(true)
    try { toast(await provisionUser(f)); onClose() }
    catch (e) { toast('Gagal: ' + (e as Error).message) }
    finally { setBusy(false) }
  }
  return (
    <Modal open title="Tambah pengguna" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nama"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="email@arunami.id" /></Field>
        <Field label="Peran"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option value="admin">Admin</option><option value="bapm">BA-PM</option><option value="investor">Investor</option></Select></Field>
      </div>
      <div className="flex gap-2 mt-5"><Button onClick={onClose}>Batal</Button><Button variant="primary" className="flex-1" disabled={busy} onClick={save}>Buat akun</Button></div>
    </Modal>
  )
}

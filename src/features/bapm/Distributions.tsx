// BA-PM → Distribusi (dari Admin): forward Admin's processed batches + proof to
// each investor. Forwarding writes `forwarded` back to the SAME store record the
// investor reads — so their distribution flips to "Dibayar" live.
import { useAuth } from '../../auth/AuthContext'
import { useActor, distAmounts } from '../shared'
import { useCollection } from '../../data/useStore'
import { store } from '../../data/store'
import { rpJt } from '../../lib/format'
import { Avatar, Button, Card, EmptyState, Pill } from '../../components/ui'
import type { Distribution } from '../../data/types'

export default function BapmDistributions() {
  const { user } = useAuth()
  const actor = useActor()
  const myCompanyIds = useCollection('companies').filter((c) => c.bapmId === user?.id).map((c) => c.id)
  const companies = useCollection('companies')
  const investors = useCollection('investors')
  const allocations = useCollection('allocations')
  const pnl = useCollection('pnl')
  const distributions = useCollection('distributions').filter((d) => myCompanyIds.includes(d.companyId) && d.status !== 'pending')

  function forward(dist: Distribution, investorId?: string) {
    const proofs: Distribution['proofs'] = { ...dist.proofs }
    const ids = investorId ? [investorId] : Object.keys(proofs)
    ids.forEach((id) => { proofs[id] = { ...proofs[id], forwarded: true } })
    const allForwarded = Object.values(proofs).every((p) => p.forwarded)
    store.update('distributions', dist.id, { proofs, status: allForwarded ? 'forwarded' : dist.status })
    const c = companies.find((x) => x.id === dist.companyId)
    store.log({ actor: actor.name, role: 'bapm', action: `Meneruskan bukti distribusi ${c?.name} ${dist.period}${investorId ? '' : ' ke semua investor'}` })
  }

  if (!distributions.length) return <EmptyState title="Belum ada distribusi dari Admin" desc="Admin memproses bagi hasil di tab Bagi hasil & transfer, lalu muncul di sini untuk diteruskan." />

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Bukti transfer dari Admin. Teruskan ke setiap investor untuk menyelesaikan distribusi.</p>
      {distributions.map((d) => {
        const company = companies.find((c) => c.id === d.companyId)!
        const calc = distAmounts(d, company, allocations, pnl)
        const allForwarded = Object.values(d.proofs).every((p) => p.forwarded)
        return (
          <Card key={d.id}>
            <div className="flex items-center justify-between mb-3">
              <div><span className="font-semibold text-ink">{company.name}</span> <span className="text-xs text-ink-faint">· {d.period} · {rpJt(calc.net)}</span></div>
              {d.status === 'held' ? <Pill tone="red">Ditahan</Pill> : allForwarded ? <Pill tone="green">Selesai diteruskan</Pill>
                : <Button sm variant="primary" onClick={() => forward(d)}>Teruskan semua</Button>}
            </div>
            {d.status !== 'held' && (
              <table className="w-full text-sm">
                <tbody>
                  {calc.rows.map((r) => {
                    const inv = investors.find((i) => i.id === r.investorId)
                    const p = d.proofs[r.investorId]
                    return (
                      <tr key={r.investorId} className="border-t border-gray-100">
                        <td className="py-2"><div className="flex items-center gap-2"><Avatar name={inv?.name ?? '?'} color="#A21CAF" />{inv?.name}</div></td>
                        <td className="py-2 text-right tabular-nums text-ok font-medium">{rpJt(r.amountJt)}</td>
                        <td className="py-2 pl-4 text-xs text-ink-faint">{p?.file ?? '—'}</td>
                        <td className="py-2 text-right">
                          {p?.forwarded ? <span className="text-xs text-ok">✓ Diteruskan</span> : <Button sm onClick={() => forward(d, r.investorId)}>Teruskan</Button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// Money operations service (P2). The ONE place screens call to process a
// distribution. In Firebase mode it delegates to a Cloud Function that
// recomputes the split server-side (client can't submit amounts). In mock mode
// it computes locally — but still recomputes from the cap table + P&L, never
// trusting caller-supplied amounts, so the two paths behave identically.
import { firebaseEnabled, firebaseApp } from './firebase'
import { store } from '../data/store'
import { computeDistribution, pnlDerived } from '../data/calc'
import type { Distribution, Role } from '../data/types'

export async function processDistribution(opts: {
  distId: string
  proofs: Record<string, { file: string; url?: string }> // investorId -> uploaded proof
  actor: { name: string; role: Role }
}): Promise<void> {
  if (firebaseEnabled && firebaseApp) {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const fn = httpsCallable(getFunctions(firebaseApp), 'processDistribution')
    await fn({ distId: opts.distId, proofs: opts.proofs })
    return // onSnapshot brings the server's authoritative result back into the store
  }

  // ── Mock mode: recompute locally, write to the store ──
  const db = store.snapshot()
  const dist = db.distributions.find((d) => d.id === opts.distId)
  if (!dist) return
  const company = db.companies.find((c) => c.id === dist.companyId)
  if (!company) return
  const allocs = db.allocations.filter((a) => a.companyId === company.id)
  const fin = db.pnl.find((p) => p.companyId === company.id && p.period === dist.period)
  const calc = computeDistribution(company.scheme, allocs, { revenue: fin?.revenue ?? 0, net: fin ? pnlDerived(fin).net : 0 })

  const amounts: Record<string, number> = {}
  const proofs: Distribution['proofs'] = {}
  for (const r of calc.rows) {
    amounts[r.investorId] = r.amountJt
    const p = opts.proofs[r.investorId]
    proofs[r.investorId] = { file: p?.file, url: p?.url, forwarded: false }
  }
  store.update('distributions', opts.distId, { status: 'reported', proofs, amounts, netJt: calc.net })
  store.log({ actor: opts.actor.name, role: 'admin', action: `Memproses bagi hasil ${company.name} ${dist.period} (${calc.net} jt)` })
}

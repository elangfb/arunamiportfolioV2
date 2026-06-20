// Small cross-feature helpers.
import { useAuth } from '../auth/AuthContext'
import { useCollection } from '../data/useStore'
import { computeDistribution, pnlDerived } from '../data/calc'
import type { Allocation, Company, Distribution, PnL, Role } from '../data/types'

/** The logged-in user as an audit "actor" (name + role). */
export function useActor(): { name: string; role: Role } {
  const { user } = useAuth()
  return { name: user?.name ?? 'Sistem', role: user?.role ?? 'admin' }
}

/**
 * Per-investor distribution split for a batch. Used identically by Admin,
 * BA-PM and Investor so the numbers always match — single calc, one truth.
 */
export function distAmounts(dist: Distribution, company: Company, allAllocations: Allocation[], allPnl: PnL[]) {
  const allocs = allAllocations.filter((a) => a.companyId === company.id)
  const fin = allPnl.find((p) => p.companyId === company.id && p.period === dist.period)
  const revenue = fin?.revenue ?? 0
  const net = fin ? pnlDerived(fin).net : 0
  return computeDistribution(company.scheme, allocs, { revenue, net })
}

export type InvestorDistStatus = 'paid' | 'processing' | 'held'
export interface InvestorRecord { dist: Distribution; company: Company; amountJt: number; status: InvestorDistStatus }

/** Every distribution an investor is part of, with their amount + status. */
export function investorRecords(
  investorId: string,
  distributions: Distribution[],
  companies: Company[],
  allocations: Allocation[],
  pnl: PnL[],
): InvestorRecord[] {
  const out: InvestorRecord[] = []
  for (const dist of distributions) {
    const proof = dist.proofs[investorId]
    if (!proof) continue // not yet reported to this investor
    const company = companies.find((c) => c.id === dist.companyId)
    if (!company) continue
    const row = distAmounts(dist, company, allocations, pnl).rows.find((r) => r.investorId === investorId)
    if (!row) continue
    const status: InvestorDistStatus = dist.status === 'held' ? 'held' : proof.forwarded ? 'paid' : 'processing'
    out.push({ dist, company, amountJt: row.amountJt, status })
  }
  return out
}

/** Resolve the investor record for the logged-in user (matched by email). */
export function useMyInvestor() {
  const { user } = useAuth()
  return useCollection('investors').find((i) => i.email === user?.email) ?? null
}

// Money math — server copy of the app's src/data/calc.ts (the parts needed to
// compute a distribution). DUPLICATED on purpose: Functions and the web app are
// separate packages. Keep these two files in sync (tracked as a P6 follow-up to
// unify via a shared package).

export const PLATFORM_FEE_PCT = 12

export interface ReturnScheme {
  type: 'revenue' | 'profit' | 'blended' | 'fixed'
  ratePct: number
  bonusPct?: number
  frequency: string
  capPct?: number | null
  minPct?: number | null
  basis: string
}
export interface Alloc { investorId: string; nominalJt: number; companyId: string }
export interface PnLLike { revenue: number; cogs: number; opex: number; depreciation: number; financeCost: number }

export function capSum(a: { nominalJt: number }[]): number {
  return a.reduce((s, x) => s + (x.nominalJt || 0), 0)
}
export function ownership(alloc: Alloc, companyAllocs: Alloc[]): number {
  const total = capSum(companyAllocs)
  return total > 0 ? alloc.nominalJt / total : 0
}
export function pnlNet(p: PnLLike): number {
  const gross = p.revenue - p.cogs
  const operating = gross - p.opex - p.depreciation
  return operating - p.financeCost
}

export function distributionPool(scheme: ReturnScheme, opts: { revenue: number; net: number; totalNominal: number }): number {
  const { revenue, net, totalNominal } = opts
  switch (scheme.type) {
    case 'revenue': return Math.max(0, (scheme.ratePct / 100) * revenue)
    case 'profit': return Math.max(0, (scheme.ratePct / 100) * net)
    case 'fixed': return (scheme.ratePct / 100) * totalNominal / 12
    case 'blended': {
      const base = (scheme.ratePct / 100) * totalNominal / 12
      const bonus = net > 400 ? ((scheme.bonusPct || 0) / 100) * totalNominal / 12 : 0
      return base + bonus
    }
    default: return 0
  }
}

export interface DistRow { investorId: string; nominalJt: number; ownershipPct: number; amountJt: number }

export function computeDistribution(
  scheme: ReturnScheme,
  allocations: Alloc[],
  financials: { revenue: number; net: number },
  socialFundPct = 0,
): { rows: DistRow[]; pool: number; fee: number; social: number; net: number } {
  const totalNominal = capSum(allocations)
  const pool = distributionPool(scheme, { ...financials, totalNominal })
  const fee = (PLATFORM_FEE_PCT / 100) * pool
  const social = (socialFundPct / 100) * pool
  const net = Math.max(0, pool - fee - social)
  const rows: DistRow[] = allocations.map((a) => {
    const own = ownership(a, allocations)
    return { investorId: a.investorId, nominalJt: a.nominalJt, ownershipPct: Math.round(own * 1000) / 10, amountJt: Math.round(net * own * 10) / 10 }
  })
  return { rows, pool, fee, social, net }
}

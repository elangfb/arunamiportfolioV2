// ════════════════════════════════════════════════════════════════
// CALCULATION ENGINE — pure functions, no UI, no store.
// This is the financial "truth" of the platform. Kept isolated so it
// is easy to read, test, and tweak while prototyping return models.
// ════════════════════════════════════════════════════════════════

import type { Allocation, Company, PnL, ReturnScheme } from './types'

export const PLATFORM_FEE_PCT = 12 // Arunami fee taken from the distribution pool

// ── Cap table ──────────────────────────────────────────────────
export function capSum(allocations: Allocation[]): number {
  return allocations.reduce((s, a) => s + (a.nominalJt || 0), 0)
}

/** Ownership share of one allocation within its company (0..1). */
export function ownership(alloc: Allocation, companyAllocations: Allocation[]): number {
  const total = capSum(companyAllocations)
  return total > 0 ? alloc.nominalJt / total : 0
}

/** % of target raised. Can exceed 100 (oversubscribed). */
export function fillPct(company: Company, companyAllocations: Allocation[]): number {
  const targetJt = (company.targetInvestmentB || 0) * 1000
  return targetJt > 0 ? Math.round((capSum(companyAllocations) / targetJt) * 100) : 0
}

// ── P&L derived lines ──────────────────────────────────────────
export function pnlDerived(p: PnL) {
  const gross = p.revenue - p.cogs
  const operating = gross - p.opex - p.depreciation
  const net = operating - p.financeCost
  return { gross, operating, net }
}

// ── Distribution pool ──────────────────────────────────────────
// The monthly pool to share among investors, BEFORE platform fee.
// One readable switch per scheme type — add a model by adding a case.
export function distributionPool(scheme: ReturnScheme, opts: { revenue: number; net: number; totalNominal: number }): number {
  const { revenue, net, totalNominal } = opts
  switch (scheme.type) {
    case 'revenue':
      return Math.max(0, (scheme.ratePct / 100) * revenue)
    case 'profit':
      return Math.max(0, (scheme.ratePct / 100) * net)
    case 'fixed':
      // rate is annual; pay 1/12 of (rate% × principal) each month
      return (scheme.ratePct / 100) * totalNominal / 12
    case 'blended': {
      const base = (scheme.ratePct / 100) * totalNominal / 12
      const bonus = net > 400 ? ((scheme.bonusPct || 0) / 100) * totalNominal / 12 : 0
      return base + bonus
    }
  }
}

export interface DistRow {
  investorId: string
  nominalJt: number
  ownershipPct: number
  amountJt: number
}

/**
 * Full per-investor split for a period.
 * pool → minus platform fee → minus optional social fund → split by ownership.
 */
export function computeDistribution(
  scheme: ReturnScheme,
  allocations: Allocation[],
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
    return {
      investorId: a.investorId,
      nominalJt: a.nominalJt,
      ownershipPct: Math.round(own * 1000) / 10,
      amountJt: Math.round(net * own * 10) / 10,
    }
  })
  return { rows, pool, fee, social, net }
}

// ── Health (wanprestasi) ───────────────────────────────────────
export interface HealthRules {
  latePaymentDays: [number, number, number]   // siaga 1/2/3 thresholds
  commVacuumDays: [number, number, number]
  underperfMonths: [number, number, number]
}

export const DEFAULT_HEALTH_RULES: HealthRules = {
  latePaymentDays: [30, 60, 90],
  commVacuumDays: [14, 30, 45],
  underperfMonths: [1, 2, 3],
}

/** Derive a health level from signals + rules (highest triggered wins). */
export function deriveHealth(
  signals: { lateDays: number; vacuumDays: number; underperfMonths: number },
  rules: HealthRules = DEFAULT_HEALTH_RULES,
): Company['health'] {
  const hit = (idx: number) =>
    signals.lateDays >= rules.latePaymentDays[idx] ||
    signals.vacuumDays >= rules.commVacuumDays[idx] ||
    signals.underperfMonths >= rules.underperfMonths[idx]
  if (hit(2)) return 'siaga3'
  if (hit(1)) return 'siaga2'
  if (hit(0)) return 'siaga1'
  return 'sehat'
}

// ════════════════════════════════════════════════════════════════
// DOMAIN MODEL — the single contract for the whole app.
// Change a field here and every screen/feature follows. Keep this
// small and readable; it is the map of the system's data flow.
// ════════════════════════════════════════════════════════════════

export type Role = 'admin' | 'bapm' | 'investor'

export type HealthLevel = 'sehat' | 'siaga1' | 'siaga2' | 'siaga3'
export type KycStatus = 'pending' | 'verified' | 'rejected'
export type CompanyStatus = 'prospect' | 'onboarding' | 'active' | 'closed'
export type DistributionStatus = 'pending' | 'reported' | 'forwarded' | 'held'
export type ReportStatus = 'draft' | 'published'

// How an investor's return is calculated. `ratePct` makes the engine
// numeric & easy to compute; `basis` is the human-readable explanation.
export type SchemeType = 'revenue' | 'profit' | 'blended' | 'fixed'
export interface ReturnScheme {
  type: SchemeType
  ratePct: number            // headline rate (interpretation depends on type)
  bonusPct?: number          // for 'blended'
  frequency: 'monthly' | 'quarterly'
  capPct?: number | null     // annualised cap, optional
  minPct?: number | null     // annualised floor/guarantee, optional
  basis: string              // free-text explanation shown to users
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive' | 'pending'
  teamArunami?: boolean      // internal staff — exempt from platform fee
}

export interface Company {            // a portfolio company
  id: string
  name: string
  code: string                        // e.g. NX-001
  legalName: string
  industry: string
  stage: string
  targetInvestmentB: number           // target raise, IDR billions
  feePct: number                      // platform management fee
  status: CompanyStatus
  health: HealthLevel
  bapmId: string | null               // assigned BA-PM (user id)
  scheme: ReturnScheme
  principalReturn: boolean            // is principal returned at term end
  contractStart?: string
  contractEnd?: string
}

export interface Investor {
  id: string
  name: string
  email: string
  type: 'individual' | 'institution'
  npwp?: string
  kyc: KycStatus
  joinedAt: string
  docs?: Partial<Record<'ktp' | 'npwp' | 'bank', string>>  // filename per doc
}

export interface Allocation {         // one cap-table row (investor ↔ company)
  id: string
  companyId: string
  investorId: string
  nominalJt: number                   // invested principal, IDR juta
}

export interface PnL {                // one month of actuals for a company
  id: string
  companyId: string
  period: string                      // e.g. "Okt 2024"
  ts: number                          // sortable timestamp
  revenue: number                     // IDR juta
  cogs: number
  opex: number
  depreciation: number
  financeCost: number
}

export interface Distribution {
  id: string
  companyId: string
  period: string
  status: DistributionStatus
  yieldPct: number                    // realised period yield used for the split
  note?: string
  // per-investor proof + forward state, keyed by investorId
  proofs: Record<string, { file?: string; forwarded?: boolean }>
  createdAt: string
}

export interface Report {
  id: string
  companyId: string
  investorId: string | null           // null = applies to all investors
  period: string
  kind: 'monthly' | 'quarterly'
  status: ReportStatus
  body: string
  publishedAt?: string
  reads?: Record<string, boolean>     // investorId -> read
}

export interface Document {
  id: string
  companyId: string
  name: string
  type: string
  version: string
  size: string
}

export interface AuditEntry {
  id: string
  ts: number
  actor: string
  role: Role
  action: string
}

// The whole database in one shape. The store holds exactly this.
export interface DB {
  users: User[]
  companies: Company[]
  investors: Investor[]
  allocations: Allocation[]
  pnl: PnL[]
  distributions: Distribution[]
  reports: Report[]
  documents: Document[]
  audit: AuditEntry[]
}

export type CollectionName = keyof DB

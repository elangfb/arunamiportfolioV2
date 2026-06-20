// Demo data for prototyping. Edit freely — this is what you see on first run
// (mock mode) and what `store.reset()` restores. Keep it small but enough to
// demonstrate the full money flow across all three roles.
import type { DB } from './types'

export function makeSeed(): DB {
  return {
    users: [
      { id: 'u_admin', name: 'Andi Pratama', email: 'admin@arunami.id', role: 'admin', status: 'active', teamArunami: true },
      { id: 'u_bapm', name: 'Reza Wijaya', email: 'bapm@arunami.id', role: 'bapm', status: 'active', teamArunami: true },
      { id: 'u_inv1', name: 'Budi Santoso', email: 'budi@email.com', role: 'investor', status: 'active' },
      { id: 'u_inv2', name: 'Citra Dewi', email: 'citra@email.com', role: 'investor', status: 'active' },
    ],

    companies: [
      {
        id: 'c_nexavar', name: 'Nexavar Capital', code: 'NX-001', legalName: 'PT Nexavar Kapital Indonesia',
        industry: 'Fintech', stage: 'Series B', targetInvestmentB: 32, feePct: 2.0,
        status: 'active', health: 'siaga2', bapmId: 'u_bapm', principalReturn: false,
        contractStart: 'Jan 2023', contractEnd: 'Des 2025',
        scheme: { type: 'revenue', ratePct: 7, frequency: 'monthly', capPct: 15, minPct: null, basis: '7% dari gross revenue bulanan, cap 15% p.a.' },
      },
      {
        id: 'c_kirana', name: 'Kirana Nusantara', code: 'KN-003', legalName: 'PT Kirana Nusantara Sejahtera',
        industry: 'Pendidikan', stage: 'Series A', targetInvestmentB: 20, feePct: 2.5,
        status: 'active', health: 'sehat', bapmId: 'u_bapm', principalReturn: true,
        contractStart: 'Des 2023', contractEnd: 'Nov 2025',
        scheme: { type: 'fixed', ratePct: 10.5, frequency: 'monthly', capPct: null, minPct: 10.5, basis: '10,5% p.a. dijamin, dibayar bulanan' },
      },
    ],

    investors: [
      { id: 'i_budi', name: 'Budi Santoso', email: 'budi@email.com', type: 'individual', npwp: '09.254.871.3-014.000', kyc: 'verified', joinedAt: 'Jan 2023' },
      { id: 'i_citra', name: 'Citra Dewi', email: 'citra@email.com', type: 'individual', npwp: '08.112.443.2-021.000', kyc: 'verified', joinedAt: 'Mar 2023' },
      { id: 'i_dharma', name: 'Dharma Putra', email: 'dharma@email.com', type: 'institution', npwp: '01.998.221.7-033.000', kyc: 'pending', joinedAt: 'Jun 2026' },
    ],

    allocations: [
      { id: 'a1', companyId: 'c_nexavar', investorId: 'i_budi', nominalJt: 450 },
      { id: 'a2', companyId: 'c_nexavar', investorId: 'i_citra', nominalJt: 375 },
      { id: 'a3', companyId: 'c_kirana', investorId: 'i_budi', nominalJt: 1000 },
    ],

    pnl: [
      { id: 'p1', companyId: 'c_nexavar', period: 'Okt 2024', ts: 202410, revenue: 1200, cogs: 700, opex: 320, depreciation: 60, financeCost: 36 },
      { id: 'p2', companyId: 'c_kirana', period: 'Okt 2024', ts: 202410, revenue: 4100, cogs: 2400, opex: 900, depreciation: 120, financeCost: 60 },
    ],

    distributions: [
      // One batch ready for Admin to process, to demonstrate the flow start.
      { id: 'd1', companyId: 'c_nexavar', period: 'Okt 2024', status: 'pending', yieldPct: 7, note: 'Revenue share Okt 2024', proofs: {}, createdAt: 'Okt 2024' },
    ],

    reports: [],

    documents: [
      { id: 'doc1', companyId: 'c_nexavar', name: 'Perjanjian Investasi NX-001', type: 'Kontrak/PKS', version: 'v1.0', size: '1.2 MB' },
    ],

    audit: [
      { id: 'au1', ts: 202406200900, actor: 'Andi Pratama', role: 'admin', action: 'Seed data prototype dimuat' },
    ],
  }
}

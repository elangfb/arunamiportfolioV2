// React bindings for the store. Components read data through these hooks and
// write through `store` directly — that's the whole data flow.
import { useSyncExternalStore } from 'react'
import { store } from './store'
import type { CollectionName, DB } from './types'

/** The whole DB, reactive. */
export function useDB(): DB {
  return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
}

/** One collection, reactive. e.g. useCollection('companies') */
export function useCollection<K extends CollectionName>(name: K): DB[K] {
  return useDB()[name]
}

// ── Small selectors for common joins (keep components thin) ─────
export function useCompany(id?: string | null) {
  return useCollection('companies').find((c) => c.id === id)
}
export function useCompaniesForBapm(bapmId?: string | null) {
  return useCollection('companies').filter((c) => c.bapmId === bapmId)
}
export function useAllocations(companyId?: string | null) {
  return useCollection('allocations').filter((a) => a.companyId === companyId)
}
export function useInvestor(id?: string | null) {
  return useCollection('investors').find((i) => i.id === id)
}
/** Companies an investor holds, with that investor's allocation attached. */
export function useInvestorHoldings(investorId?: string | null) {
  const allocations = useCollection('allocations')
  const companies = useCollection('companies')
  return allocations
    .filter((a) => a.investorId === investorId)
    .map((a) => ({ allocation: a, company: companies.find((c) => c.id === a.companyId)! }))
    .filter((h) => h.company)
}

// Re-export the store so screens can write: `import { store } from '@/data/useStore'`
export { store } from './store'

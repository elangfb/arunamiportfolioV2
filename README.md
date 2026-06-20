# Arunami — Investment Portfolio Platform (Prototype)

A working prototype of the Arunami platform across its three roles — **Admin · BA-PM · Investor** — built from `../consolidated-features.md`. Vite + React + TypeScript, Firebase-ready, **mock-first** so it runs with zero setup.

> **Why this rebuild exists:** the V2 HTML prototypes (`../flow-audit.md` §2) fragmented the data layer — Admin/Investor shared a store, BA-PM didn't, and the store file was missing. This app fixes that by design: **one typed store, all three roles, one data flow.**

---

## Run it

```bash
cd arunami-app
npm install
npm run dev          # opens http://localhost:5173 in MOCK mode (no backend)
npm run typecheck    # optional: TS check
```

On the login screen, pick any seeded user to enter as that role. Use **↻ Reset data** (top-right) anytime to restore the demo seed.

### Use real Firebase (optional)
Copy `.env.example` → `.env.local`, fill your Firebase web config, set `VITE_USE_FIREBASE=true`. Nothing else changes — the store swaps from `MockStore` to `FirestoreStore` behind the same interface. (Demo login still picks a seeded user; wiring real email/password auth is a documented TODO in `src/auth/AuthContext.tsx`.)

---

## The data flow (read this first)

Everything funnels through **one store** (`src/data/store.ts`). Screens **read** via hooks and **write** via `store.*`. That's the whole mental model:

```
 Screen ──(store.add / update / remove)──▶  STORE (single DB)  ──(notify)──▶  every subscribed screen re-renders
            write                              types.ts shape                    read via useCollection(...)
```

- `src/data/types.ts` — **the contract.** One `DB` shape, all entities. Change a field here, everything follows.
- `src/data/store.ts` — **the single source of truth.** `MockStore` (localStorage) by default; `FirestoreStore` when Firebase is on. Same API either way.
- `src/data/calc.ts` — **pure money math** (cap table, P&L, bagi-hasil split, health). No UI, no store — easy to read & tweak.
- `src/data/useStore.ts` — React hooks (`useCollection`, selectors). Reads only.
- `src/features/shared.ts` — cross-role helpers (`distAmounts`, `investorRecords`) so all roles compute identical numbers.

Because all three roles share this store, an Admin action is **immediately visible** to BA-PM and Investor.

---

## Walk the money flow (proves the single store)

1. **Admin** → *Perusahaan*: onboard a company (or use the seeded ones) → open its **Cap table**, add a verified investor + nominal.
2. **Admin** → *Investor & KYC*: verify a pending investor (e.g. Dharma Putra) — only then can they be allocated.
3. **BA-PM** (log out → log in as Reza) → *P&L aktual*: enter a month of P&L → *Bagi hasil*: see the per-investor split computed by `calc.ts`.
4. **Admin** → *Bagi hasil & transfer*: process the pending batch, upload per-investor proof → **report to BA-PM**.
5. **BA-PM** → *Distribusi*: **forward** the proof to investors.
6. **Investor** (log in as Budi) → *Dashboard / Distribusi*: the distribution now shows **Dibayar** with a viewable proof; *Laporan* shows the published report. All live from the one store.

---

## Add a feature in 3 steps

1. **Data** (if needed): add/extend an entity in `src/data/types.ts` (+ seed in `src/data/seed.ts`).
2. **Screen**: create `src/features/<role>/MyPage.tsx` — read with `useCollection(...)`, write with `store.*`.
3. **Wire it**: add a `<Route>` in `src/App.tsx` and a nav item in `src/config/roles.ts`.

Toggle work-in-progress features in `src/config/features.ts`.

---

## Project structure

```
src/
  data/        types.ts · calc.ts · seed.ts · store.ts · useStore.ts   ← data flow lives here
  lib/         firebase.ts · format.ts
  auth/        AuthContext · Login · RoleGuard
  config/      roles.ts (nav) · features.ts (flags)
  components/  ui.tsx (kit) · Layout.tsx (shell)
  features/    admin/ · bapm/ · investor/   ← one folder per role, one file per page
  App.tsx      central router
```

## Scope (see `PROJECT-PLAN.md`)

Built: **Phase 0 (foundation)** + **Phase 1 (Essential money-flow)** end-to-end. Phase 2/3 (AI extraction, real PDF, lifetime reports, benchmarking, meeting mode, …) are flagged off in `config/features.ts` and noted inline as `Phase 2`/`Phase 3` — easy to fill in next.

Track progress in **`PROJECT-PLAN.md`** (updated as the build advances).

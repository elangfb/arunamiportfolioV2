# Arunami V3 Prototype — Project Management Plan & Progress Tracker

> **Single source of truth for project progress.** Updated after every build chunk so we can always recall where we are.
> Status legend: ✅ Done · 🔄 In progress · ⬜ To do · ⏸ Deferred (later phase)
> Last updated: 2026-06-20 · Mode: prototyping

---

## 1. Project overview

**Goal:** a working, modifiable prototype of the Arunami investment-portfolio platform (`arunami-app/`), built from `../consolidated-features.md`, that fixes the V2 audit's #1 flaw — a fragmented data layer (`../flow-audit.md` §2).

**How it fixes it:** one Vite + React + TypeScript SPA where **all three roles (Admin · BA-PM · Investor) read/write a single typed data store**. **Mock-first** (in-memory + localStorage, seeded — runs with zero setup); flips to **Firebase** via env vars.

**Status: MVP COMPLETE & verified** — `npm run typecheck` ✅ · `npm run build` ✅ (79 modules).

---

## 2. Architecture decisions (locked)

| # | Decision | Why |
|---|---|---|
| D1 | React 18 + Vite + TS + Tailwind + React Router | Matches V1 stack intent; fast, typed, modular |
| D2 | **One typed domain model** `data/types.ts` (`DB` shape) | Single contract — change a field once |
| D3 | **One store, swappable backend** `data/store.ts` (`MockStore` ⇄ `FirestoreStore`) | Fixes V2 fragmentation; runs offline; Firebase = flip a flag |
| D4 | **Pure calc engine** `data/calc.ts` (no UI/store coupling) | Return-model math easy to read & tweak |
| D5 | Config-driven nav/roles + feature-folder layout + shared UI kit | "Add a feature in 3 steps"; prototyping-friendly |
| D6 | Reactive reads via `useSyncExternalStore` hooks | Live cross-role updates from one store |

---

## 3. Milestones

| Milestone | Maps to | Status |
|---|---|---|
| **M0 — Foundation** (store, auth, shell) | Phase 0 | ✅ Done |
| **M1 — Essential money-flow** | Phase 1 | ✅ Done |
| **M2 — Important** (AI extraction, real PDF, lifetime reports, notifications) | Phase 2 | ⏸ Deferred (flagged off in `config/features.ts`) |
| **M3 — Nice-to-have** (benchmarking, meeting mode, custom categories, …) | Phase 3 | ⏸ Deferred |

---

## 4. Task board

### Workstream A — Foundation & data layer (M0) — ✅
- ✅ Build config · entry · `index.css`
- ✅ `data/types.ts` · `lib/format.ts` · `data/calc.ts`
- ✅ `lib/firebase.ts` · `data/seed.ts` · `data/store.ts` (Mock + Firestore) · `data/useStore.ts` · `vite-env.d.ts`

### Workstream B — App shell & auth (M0) — ✅
- ✅ `config/roles.ts` · `config/features.ts`
- ✅ `auth/AuthContext` · `Login` · `RoleGuard`
- ✅ `components/ui.tsx` (Button, Card, StatCard, Pill, HealthBadge, Modal, Field, Input/Select/Textarea, EmptyState, Avatar, toast)
- ✅ `components/Layout.tsx` · `App.tsx` · `features/shared.ts`

### Workstream C — Admin screens (M1) — ✅
- ✅ Dashboard · Companies (+onboard +cap table) · Investors (+KYC) · Distributions (+proof → report)

### Workstream D — BA-PM screens (M1) — ✅
- ✅ Portfolios · PnL entry · Bagi hasil · Distributions (forward) · Reports (publish)

### Workstream E — Investor screens (M1) — ✅
- ✅ Dashboard · Distributions (+proof) · Reports (mark read) · Performance

### Workstream F — Docs & PM — ✅
- ✅ `PROJECT-PLAN.md` · `README.md`

### Next up (M2 — when ready)
- ⬜ AI P&L/projection extraction (replace manual entry in `bapm/PnL.tsx`)
- ⬜ AI report drafting (`bapm/Reports.tsx`) · real PDF export (`investor/Reports.tsx`)
- ⬜ Lifetime / accumulated investor report · in-app proof notification banner
- ⬜ Wire real Firebase email/password auth (`auth/AuthContext.tsx`)

---

## 5. Progress log (newest first — for recall)
- **2026-06-20 (3)** — **MVP complete.** All 3 roles built end-to-end on one shared store. `typecheck` + `build` pass (79 modules, 1.4s). Walkthrough in README §"Walk the money flow".
- **2026-06-20 (2)** — Data layer + shell + auth done; Admin/BA-PM/Investor screens built. PM plan saved to repo.
- **2026-06-20 (1)** — Foundation committed (build config + entry + `types`/`format`/`calc`). Build interrupted (hardware), resumed.

## 6. Decisions log
- **2026-06-20** — Prototype is the V2 target; 3-role model (BA-PM = Analyst+IR); Admin owns transfer-proof. Mock-first store chosen so the prototype runs with zero backend setup. Demo login = pick a seeded user (real Firebase auth = documented TODO).

## 7. Risks / watch-list
- Bagi-hasil engine (`calc.ts`) + cap table = where a bug pays the wrong investor → extra QA before any "real" use.
- KYC + audit log are compliance gates, not nice-to-haves.
- Keep all math in `calc.ts`/`format.ts` — never re-implement in components.
- Demo auth is not real auth — do not expose externally until Firebase auth is wired.

## 8. How to recall / resume
Read §4 Task board + §5 Progress log (last entry). Next work = the "Next up (M2)" list.

## 9. Verification — DONE for MVP
1. ✅ `npm install && npm run dev` → opens :5173 in mock mode (no Firebase).
2. ✅ `npm run typecheck` passes · ✅ `npm run build` passes (79 modules).
3. ⏳ Manual walkthrough (see README): Admin onboard → KYC → cap table; BA-PM P&L → bagi hasil → forward; Investor sees paid distribution + proof + report — all live from one store. *(Run `npm run dev` to click through.)*
4. (Optional) `VITE_USE_FIREBASE=true` + creds → same UI, Firestore-backed.

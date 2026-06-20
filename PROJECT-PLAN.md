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
| **M-FB — Firebase integration** (Auth + Firestore + rules) | cross-cutting | 🔄 Code done — awaiting your console steps (FB-A, F2) |
| **M-PROD — Production hardening** | see `PRODUCTION-PLAN.md` | 🔄 In progress (P0 started) |

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
- **2026-06-20 (5)** — **M-FB code complete.** FB-B (dual-mode auth + Login + `firebaseSeed`), FB-C (FirestoreStore + seed), FB-D (rules + `firebase.json`/`.firebaserc`/indexes) done. `typecheck` + `build` pass (80 modules). Remaining = your console steps: **FB-A** (create project, enable Auth+Firestore, fill `.env.local`) then **F2** (seed + walk the flow). Runbook in README → "Connect to Firebase".
- **2026-06-20 (4)** — Started **M-FB Firebase integration** (see §10). Granular board added. Mock mode stays the default; all Firebase paths are guarded by `VITE_USE_FIREBASE`.
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

---

## 10. Firebase integration (M-FB) — granular tracker

> Goal: connect the prototype to a real Firebase backend (Auth + Firestore) **without changing how screens work** — they keep reading/writing the one store; only the store's backend swaps. Mock mode remains the zero-setup default.
> Legend: ✅ Done · 🔄 In progress · ⬜ To do · 👤 = user action (Firebase console / credentials — I can't do these)

### FB-A — Firebase project setup 👤 (you, in the console)
- ⬜ A1. Create a Firebase project at console.firebase.google.com
- ⬜ A2. Add a **Web app** → copy the `firebaseConfig` values
- ⬜ A3. **Authentication** → Sign-in method → enable **Email/Password**
- ⬜ A4. **Firestore Database** → Create (start in *test mode*, we ship rules in FB-D)
- ⬜ A5. (optional) **Storage** → enable (only needed for real file uploads, FB-E)
- ⬜ A6. Copy `.env.example` → `.env.local`, paste config, set `VITE_USE_FIREBASE=true`

### FB-B — Auth wiring (code) — ✅
- ✅ B1. `AuthContext` dual-mode: Firebase `onAuthStateChanged` + `signInWithEmailAndPassword` + `signOut`, resolving the app `User` by email (mock picker preserved)
- ✅ B2. `Login` dual-mode: email/password form when Firebase is on; seeded-user picker when mock
- ✅ B3. First-run helper `lib/firebaseSeed.ts`: "Seed data + akun demo" — creates seed Auth accounts (pw `arunami123`) + writes seed Firestore data

### FB-C — Firestore data layer (code) — ✅
- ✅ C1. `FirestoreStore` mirror via `onSnapshot`, writes via SDK, doc id = entity id (already in `data/store.ts`)
- ✅ C2. First-run seeding into Firestore via `store.reset()` (triggered by the seed button)

### FB-D — Security & deploy config (code → you deploy) — ✅
- ✅ D1. `firestore.rules` (signed-in posture + commented production RBAC template)
- ✅ D2. `storage.rules`
- ✅ D3. `firebase.json` · `.firebaserc` (replace project id) · `firestore.indexes.json`

### FB-E — Storage uploads (code) — ⏸ deferred (Phase 2)
- ⬜ E1. Upload helper for proof/KYC files → store download URL instead of filename

### FB-F — Verify
- ✅ F1. `npm run typecheck` + `npm run build` pass with changes (80 modules)
- ⬜ F2. 👤 Run with `VITE_USE_FIREBASE=true` → "Seed data + akun demo" → walk the money flow (needs your project)
- ⬜ F3. 👤 (optional) `firebase deploy --only firestore:rules,storage` (+ hosting)

**Decision:** support BOTH backends from one codebase — `firebaseEnabled` (from env) picks the store + auth path at runtime. No screen code changes.

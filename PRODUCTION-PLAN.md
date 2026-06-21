# Arunami — Production Readiness Plan & Progress Tracker (M-PROD)

> **Single source of truth for production hardening.** Companion to `PROJECT-PLAN.md` (which tracks feature build). Updated after every chunk.
> Legend: ✅ Done · 🔄 In progress · ⬜ To do · ⏸ Deferred · 👤 = your action (infra / billing / vendor / deploy — I can't do these)
> Last updated: 2026-06-20 · Starting point: working prototype on Firebase (commit `81ca05d`)

---

## 1. Goal & honest baseline

Turn the **prototype** into a system safe to put real money and real investors through. Today it is demo-grade: it works end-to-end but trusts the client, has open security rules, and lacks the controls a regulated investment platform needs.

**Definition of "production ready" here:** authenticated + authorized per role, money operations validated server-side, auditable & tamper-resistant, real KYC, real file storage, tested, observable, backed up, and deployed across separate environments.

---

## 2. Readiness scorecard

| Area | Today | Target | Status |
|---|---|---|---|
| Authorization (RBAC) | any signed-in user = full read/write | per-role, least-privilege, enforced in rules | 🔄 code done — deploy (P1.5) + read-scoping (P1.6) left |
| Money integrity | computed & written client-side | computed/validated server-side (Functions) | 🔄 distribution amounts now server-authoritative; cap-table validation + idempotency (P2.2/P2.3) left |
| Audit log | mutable by anyone | append-only, immutable | 🔄 rules written — deploy left |
| Auth lifecycle | shared demo password, no verify/reset | verify + reset + MFA, real provisioning | 🔄 provisioning + reset + verification done; MFA + token-revoke (P3.3/P3.4) left |
| Destructive dev tools | seed/reset button public | dev-only, removed from prod | ✅ |
| File storage | filenames only | real Storage uploads + signed URLs | 🔄 code done — enable Storage + deploy (P4.4) left |
| KYC / AML | filename + verify button | vendor-integrated identity + screening | ⬜ |
| Input validation | minimal, client-only | shared schema, enforced client + server + rules | ⬜ |
| Tests / CI | none | unit (calc), rules, component + CI gate | ⬜ |
| Observability | none | error tracking + logs + alerts | ⬜ |
| Backups / DR | none | scheduled Firestore export + restore runbook | ⬜ |
| UX robustness | happy-path | loading/empty/error/offline states | ⬜ |
| Compliance | none | retention, privacy, OJK alignment, PII handling | ⬜ |
| Environments | single | dev / staging / prod separation | ⬜ |

---

## 3. Decisions needed 👤 (these shape scope — answer when ready)

- ✅ **D-A. Target tier:** **Secure pilot / beta** (scope = P0–P4 + tests P7). Full prod (P5/P10/P11) deferred.
- ✅ **D-B. Cloud Functions:** **Enable Blaze + Cloud Functions.** Custom-claim RBAC + server-side money validation. (You enable Blaze + deploy; I write the code.)
- ⏸ **D-C. KYC/AML vendor:** deferred with P5 (out of pilot scope).
- ⬜ **D-D. Hosting:** Firebase Hosting (current config) vs Vercel — decide before P11.

---

## 4. Phases (prioritized)

### P0 — Immediate risk reduction (no infra) — ✅
- ✅ P0.1 `seedFirebase()` throws unless `import.meta.env.DEV`; Login "Setup" card dev-only (stripped from prod bundle).
- ✅ P0.2 Layout "↻ Reset data" button gated to dev-only; demo-credential prefill on the login form is also dev-only.
- ✅ P0.3 No client UI can call `store.reset()` in a prod build (seed + reset both dev-gated).

### P1 — Authorization & data security (code ✅ → 👤 deploy)
- ✅ P1.1 `functions/` — `onUserCreate` sets `role` (+ `investorId`) **custom claim** from the user's app record; admin-only `setUserRole` callable. Seeded admin gets the claim automatically.
- ✅ P1.2 `firestore.rules` rewritten → role-based: **writes strictly gated** (admin/bapm/investor), default-deny catch-all.
- ✅ P1.3 `audit` append-only (`create` only; `update`/`delete` denied).
- ✅ P1.4 `storage.rules` role-based per-path (proofs = admin write / signed-in read; kyc = admin write / admin+bapm read).
- ✅ P1.x App: `AuthContext` force-refreshes the ID token so claims load; `firebase.json` wired for functions.
- ⬜ P1.5 👤 **Deploy** (`cd functions && npm i`, then `firebase deploy --only functions,firestore:rules,storage`) + verify with rules unit tests (emulator).
- ⏸ P1.6 **Follow-up (read scoping):** investors can currently *read* operational collections (pilot compromise — the store mirrors whole collections). True per-investor read isolation needs query-scoped reads + `investorId` claim filtering. Tracked for post-pilot.

### P2 — Server-side money integrity (code → 👤 Blaze deploy) — 🔄
- ✅ P2.1 `processDistribution` Cloud Function recomputes the split server-side from cap table + P&L and stores authoritative `amounts`/`netJt`. Client passes only proofs. `lib/money.ts` keeps mock mode identical (recomputes locally, never trusts caller amounts). Functions package builds clean.
- ⬜ P2.2 Cap-table writes validated server-side (oversubscription, KYC-verified-only) — currently admin-only via rules, no server validation yet.
- ⬜ P2.3 Idempotency keys + transactional writes for money ops.
- ✅ P2.4 `firestore.rules` deny clients from writing `amounts`/`netJt` (set only by the function via admin SDK).

### P3 — Auth lifecycle (code ✅ → 👤 deploy) — 🔄
- ✅ P3.1 Admin-driven provisioning: `createUser` + `setUserDisabled` Cloud Functions + Admin **"Pengguna & akses"** page (`lib/userAdmin.ts` dual-mode). New accounts get a password-setup email; **no shared password in prod** (demo prefill is dev-only).
- ✅ P3.2 Password reset ("Lupa password?") + email-verification banner with resend.
- ⏸ P3.3 MFA (TOTP) — deferred (needs Identity Platform upgrade).
- 🔄 P3.4 Sign-out + account enable/disable done. "Sign out everywhere" (refresh-token revoke) deferred.

### P4 — Real file storage (code ✅ → 👤 enable Storage) — 🔄
- ✅ P4.1 `lib/storage.ts` upload helper (Firebase Storage → download URL; mock → object URL) + `FileButton` UI + client size/type validation.
- ✅ P4.2 Transfer-proof upload (Admin process modal) + KYC docs (Admin KYC modal) now use **real uploads**; proof/KYC store `{name,url}`; download links in Admin & Investor views.
- ✅ P4.3 `storage.rules` enforce role + size (<10MB) + content-type (PDF/image).
- ⬜ P4.4 👤 Enable Storage + deploy `storage.rules`; verify upload/download live.

### P5 — KYC / AML (code → 👤 vendor) ⏸ until D-C
- ⬜ P5.1 Integrate eKYC vendor (identity + liveness)
- ⬜ P5.2 Sanctions / PEP screening; structured KYC record + status workflow
- ⬜ P5.3 Audit trail of verification decisions

### P6 — Validation & data integrity (code)
- ⬜ P6.1 Shared **Zod** schemas for every entity (client + Functions)
- ⬜ P6.2 Enforce required fields / ranges in `firestore.rules`
- ⬜ P6.3 Referential integrity (no allocation to unverified investor / missing company)

### P7 — Tests & CI (code)
- ⬜ P7.1 **Vitest** unit tests — start with `data/calc.ts` (money math) + `shared.ts`
- ⬜ P7.2 Firestore **rules tests** (emulator) for each role
- ⬜ P7.3 Component/flow smoke tests (React Testing Library)
- ⬜ P7.4 GitHub Actions CI: typecheck + build + test on PR

### P8 — Observability & ops (code → 👤 accounts)
- ⬜ P8.1 Error tracking (Sentry) wired in `main.tsx`
- ⬜ P8.2 Structured logging in Functions; Firebase alerts/budgets
- ⬜ P8.3 App Check (anti-abuse) + basic rate limiting
- ⬜ P8.4 👤 Scheduled Firestore backup/export + documented restore

### P9 — UX robustness (code)
- ⬜ P9.1 Loading / empty / error / offline states across screens
- ⬜ P9.2 Form validation feedback; optimistic-write rollback on failure
- ⬜ P9.3 Responsive + a11y pass; consistent id-ID copy

### P10 — Compliance & legal 👤 (with code support) ⏸ until D-A
- ⬜ P10.1 Data retention + deletion policy; PII minimization
- ⬜ P10.2 Privacy policy + ToS; consent capture
- ⬜ P10.3 OJK alignment review; investor reporting/record-keeping requirements

### P11 — Release engineering (code → 👤 infra)
- ⬜ P11.1 Separate **dev / staging / prod** Firebase projects + env configs
- ⬜ P11.2 CI deploy pipeline (rules, functions, hosting)
- ⬜ P11.3 Custom domain; smoke-test checklist; rollback runbook

---

## 5. Recommended sequence
**Pilot-safe first:** P0 → P1 → P2 → P6 → P7 (this gets you *authorized, money-safe, validated, tested*). Then P3, P4, P8, P9 for a real beta. P5 + P10 + P11 for full regulated production.

---

## 6. Progress log (newest first)
- **2026-06-20 (6)** — ✅ **P4 done (code):** `lib/storage.ts` real uploads (Firebase Storage / mock object-URL), `FileButton` UI, transfer-proof + KYC-doc uploads wired into Admin, download links for Admin & Investor, `storage.rules` size/type validation. App + functions build clean. Pilot now: P0✅ P1✅ P2🔄 P3🔄 P4🔄 (all code in; awaiting deploy). Next: **P7** (tests/CI) to lock the money math.
- **2026-06-20 (5)** — ✅ **P0 closed** (reset button + demo prefill now dev-only). 🔄 **P3 done (pilot):** admin user provisioning (`createUser`/`setUserDisabled` functions + Admin "Pengguna & akses" page), password reset, email-verification banner. MFA (P3.3) + token-revoke deferred. App typecheck+build + functions build all pass. Pilot security core (P0–P3) is essentially in code; next is **P4** (real Storage uploads) then **P7** (tests).
- **2026-06-20 (4)** — 🔄 **P2 core done:** `processDistribution` Cloud Function makes distribution amounts **server-authoritative**; `lib/money.ts` dual-mode (callable vs mock); `Distribution.amounts/netJt` stored; rules deny client-set amounts. App typecheck+build pass; **functions package builds clean** (installed + compiled). Left in P2: cap-table server validation (P2.2) + idempotency (P2.3). Next phase: **P3** (auth lifecycle) per pilot sequence.
- **2026-06-20 (3)** — Decisions: **pilot tier + Blaze/Functions**. ✅ **P1 code complete** — Cloud Functions custom-claim RBAC (`functions/`), role-based `firestore.rules` (strict writes, default-deny), append-only audit, role-based `storage.rules`, token-refresh in `AuthContext`, `firebase.json` functions wiring. App typecheck + build pass. Left to you: **P1.5 deploy** (see README). Next: **P2** — move money math server-side.
- **2026-06-20 (2)** — ✅ P0.1 done: seed/reset gated to dev-only (function guard + UI hidden in prod build); typecheck + build pass. Next: D-A…D-D decisions, then P1 (authorization) — the highest-impact phase.
- **2026-06-20 (1)** — M-PROD created. Baseline = prototype on Firebase (`81ca05d`). Decisions D-A…D-D pending.

## 7. How to recall / resume
Read §2 scorecard + §4 phase checkboxes + §6 last log entry. Next work = the lowest-numbered ⬜ item in the recommended sequence (§5), unless a decision (§3) is blocking.

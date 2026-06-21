// ════════════════════════════════════════════════════════════════
// Arunami Cloud Functions — P1 authorization (custom-claim RBAC).
//
// Firestore rules enforce roles via `request.auth.token.role`. That claim is
// set here: when an Auth user is created we read their app `users` record
// (matched by email) and stamp the role onto their token. An admin-only
// callable lets you (re)assign roles later.
//
// P2 (server-side money validation) will add callables here that recompute
// distributions/cap-table writes server-side — clients will call those instead
// of writing money fields directly.
// ════════════════════════════════════════════════════════════════
import * as functions from 'firebase-functions/v1'
import * as admin from 'firebase-admin'
import { computeDistribution, pnlNet, type Alloc, type PnLLike, type ReturnScheme } from './calc.js'

admin.initializeApp()
const db = admin.firestore()

type Role = 'admin' | 'bapm' | 'investor'
const ROLES: Role[] = ['admin', 'bapm', 'investor']

/**
 * On Auth user creation, derive the role claim from the matching `users` doc
 * (by email). Also stamps `uid` back onto that doc, and `investorId` into the
 * claim for investor accounts (used later for per-investor scoping).
 *
 * Bootstrapping: because the seed writes the `users` docs *before* creating the
 * Auth accounts, the seeded admin (admin@arunami.id) gets `role: 'admin'`
 * automatically — no manual claim step needed.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const email = user.email
  if (!email) return

  const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get()
  if (usersSnap.empty) {
    functions.logger.warn(`No app user record for ${email}; no role claim set.`)
    return
  }
  const userDoc = usersSnap.docs[0]
  const role = userDoc.get('role') as Role | undefined
  if (!role || !ROLES.includes(role)) return

  const claims: Record<string, unknown> = { role }

  const invSnap = await db.collection('investors').where('email', '==', email).limit(1).get()
  if (!invSnap.empty) claims.investorId = invSnap.docs[0].id

  await admin.auth().setCustomUserClaims(user.uid, claims)
  await userDoc.ref.update({ uid: user.uid })
  functions.logger.info(`Set claims for ${email}`, claims)
})

/**
 * Admin-only: assign a role to a uid. Caller must already have role==='admin'.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Hanya admin yang dapat mengubah peran.')
  }
  const uid = String((data as { uid?: string }).uid ?? '')
  const role = String((data as { role?: string }).role ?? '') as Role
  if (!uid || !ROLES.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'uid dan role yang valid diperlukan.')
  }
  await admin.auth().setCustomUserClaims(uid, { role })
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get()
  if (!snap.empty) await snap.docs[0].ref.update({ role })
  return { ok: true, uid, role }
})

/**
 * P2 — server-side money integrity. Admin calls this to process a distribution:
 * the split is **recomputed here** from the cap table + P&L (the client cannot
 * submit amounts), then stored authoritatively as `amounts`/`netJt`. Firestore
 * rules forbid clients from writing those fields, so this is the only source.
 * The client only supplies `proofs` (transfer-proof filenames per investor).
 */
export const processDistribution = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Hanya admin yang dapat memproses distribusi.')
  }
  const distId = String((data as { distId?: string }).distId ?? '')
  const proofs = ((data as { proofs?: Record<string, { file?: string; url?: string }> }).proofs ?? {})
  if (!distId) throw new functions.https.HttpsError('invalid-argument', 'distId diperlukan.')

  const distRef = db.collection('distributions').doc(distId)
  const distSnap = await distRef.get()
  if (!distSnap.exists) throw new functions.https.HttpsError('not-found', 'Distribusi tidak ditemukan.')
  const dist = distSnap.data() as { companyId: string; period: string }

  const compSnap = await db.collection('companies').doc(dist.companyId).get()
  if (!compSnap.exists) throw new functions.https.HttpsError('failed-precondition', 'Perusahaan tidak ada.')
  const company = compSnap.data() as { name: string; scheme: ReturnScheme }

  const allocsSnap = await db.collection('allocations').where('companyId', '==', dist.companyId).get()
  const allocs = allocsSnap.docs.map((d) => d.data() as Alloc)
  const pnlSnap = await db.collection('pnl').where('companyId', '==', dist.companyId).where('period', '==', dist.period).limit(1).get()
  const fin = pnlSnap.empty ? null : (pnlSnap.docs[0].data() as PnLLike)

  const calc = computeDistribution(company.scheme, allocs, { revenue: fin?.revenue ?? 0, net: fin ? pnlNet(fin) : 0 })
  const amounts: Record<string, number> = {}
  const proofMap: Record<string, { file: string | null; url: string | null; forwarded: boolean }> = {}
  for (const r of calc.rows) {
    amounts[r.investorId] = r.amountJt
    proofMap[r.investorId] = { file: proofs[r.investorId]?.file ?? null, url: proofs[r.investorId]?.url ?? null, forwarded: false }
  }
  await distRef.update({ status: 'reported', proofs: proofMap, amounts, netJt: calc.net })

  const auditRef = db.collection('audit').doc()
  await auditRef.set({ id: auditRef.id, ts: Date.now(), actor: '(server)', role: 'admin', action: `Server memproses bagi hasil ${company.name} ${dist.period} (${calc.net} jt)` })
  return { ok: true, net: calc.net }
})

// ── P3 — Auth lifecycle: admin-driven provisioning ──────────────
/**
 * Admin-only: provision a user. Creates the Auth account (no password — the
 * client then sends a reset email so the user sets their own), sets the role
 * claim, and writes the `users` doc keyed by uid. Email/password account
 * creation for *other* users can only be done with the Admin SDK, here.
 */
export const createUser = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') throw new functions.https.HttpsError('permission-denied', 'Hanya admin.')
  const name = String((data as { name?: string }).name ?? '').trim()
  const email = String((data as { email?: string }).email ?? '').trim()
  const role = String((data as { role?: string }).role ?? '') as Role
  if (!email || !ROLES.includes(role)) throw new functions.https.HttpsError('invalid-argument', 'Email & role valid diperlukan.')

  let userRecord: admin.auth.UserRecord
  try {
    userRecord = await admin.auth().createUser({ email, displayName: name || email })
  } catch (e) {
    throw new functions.https.HttpsError('already-exists', (e as Error).message || 'Gagal membuat akun.')
  }
  await admin.auth().setCustomUserClaims(userRecord.uid, { role })
  await db.collection('users').doc(userRecord.uid).set({ id: userRecord.uid, uid: userRecord.uid, name: name || email, email, role, status: 'active' })

  const auditRef = db.collection('audit').doc()
  await auditRef.set({ id: auditRef.id, ts: Date.now(), actor: context.auth?.token.email ?? 'admin', role: 'admin', action: `Membuat akun ${role}: ${email}` })
  return { ok: true, uid: userRecord.uid }
})

/** Admin-only: enable/disable a user's Auth account. */
export const setUserDisabled = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.role !== 'admin') throw new functions.https.HttpsError('permission-denied', 'Hanya admin.')
  const uid = String((data as { uid?: string }).uid ?? '')
  const disabled = Boolean((data as { disabled?: boolean }).disabled)
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'uid diperlukan.')
  await admin.auth().updateUser(uid, { disabled })
  const snap = await db.collection('users').where('uid', '==', uid).limit(1).get()
  if (!snap.empty) await snap.docs[0].ref.update({ status: disabled ? 'inactive' : 'active' })
  return { ok: true }
})

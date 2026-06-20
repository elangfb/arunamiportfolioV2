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

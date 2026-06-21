// Firebase init — only activated when VITE_USE_FIREBASE=true AND creds present.
// Otherwise the app runs in mock mode and none of this is touched.
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** True when the app should talk to real Firebase. One switch, used everywhere. */
export const firebaseEnabled =
  import.meta.env.VITE_USE_FIREBASE === 'true' && !!cfg.apiKey && !!cfg.projectId

let app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined
let _storage: FirebaseStorage | undefined

if (firebaseEnabled) {
  app = initializeApp(cfg as Record<string, string>)
  _auth = getAuth(app)
  _db = getFirestore(app)
  _storage = getStorage(app)
}

export const auth = _auth
export const db = _db
export const storage = _storage
export const firebaseApp = app

import { FirebaseApp, getApps, initializeApp } from 'firebase/app'

let app: FirebaseApp | null = null
let initError: string | null = null

type FirebaseCfg = {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

function loadConfig(): FirebaseCfg {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function getFirebaseInitError() {
  return initError
}

// NOTE: This React module must preserve the existing Firebase setup.
// Prefer env vars so it can be used without altering existing pages.
// Add `react-resident-portal/.env.example` with VITE_* keys.
export function firebaseAppInit(): FirebaseApp | null {
  if (app) return app
  if (initError) return null

  const cfg = loadConfig()
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length === Object.keys(cfg).length) {
    initError = 'Firebase is not configured for react-resident-portal. Copy `.env.example` to `.env` and fill `VITE_FIREBASE_*` values.'
    return null
  }

  if (missing.length) {
    initError = `Firebase config is incomplete for react-resident-portal. Missing: ${missing.join(', ')}.`
    return null
  }

  if (!getApps().length) {
    app = initializeApp(cfg)
  } else {
    app = getApps()[0]
  }
  return app
}


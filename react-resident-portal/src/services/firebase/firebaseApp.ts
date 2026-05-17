import { FirebaseApp, getApps, initializeApp } from 'firebase/app'

let app: FirebaseApp | null = null

// NOTE: This React module must preserve the existing Firebase setup.
// We rely on env vars so it can be used without altering existing pages.
// Add `react-resident-portal/.env.example` with VITE_* keys.
export function firebaseAppInit() {
  if (app) return app

  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const hasAny = Object.values(cfg).some(Boolean)
  if (!hasAny) {
    // Still allow module to load; hooks will show error if Firebase init fails.
    throw new Error('Firebase env vars are missing for react-resident-portal. Check .env.')
  }

  if (!getApps().length) {
    app = initializeApp(cfg)
  } else {
    app = getApps()[0]
  }
  return app
}


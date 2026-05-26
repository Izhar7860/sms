import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { firebaseAppInit, getFirebaseInitError } from './firebaseApp'

export function getFirebaseAuth() {
  const app = firebaseAppInit()
  if (!app) {
    throw new Error(getFirebaseInitError() || 'Firebase is not configured.')
  }
  return getAuth(app)
}

export function getFirebaseFirestore() {
  const app = firebaseAppInit()
  if (!app) {
    throw new Error(getFirebaseInitError() || 'Firebase is not configured.')
  }
  return getFirestore(app)
}

export function getFirebaseStorage() {
  const app = firebaseAppInit()
  if (!app) {
    throw new Error(getFirebaseInitError() || 'Firebase is not configured.')
  }
  return getStorage(app)
}



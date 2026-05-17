import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { firebaseAppInit } from './firebaseApp'

export function getFirebaseAuth() {
  const app = firebaseAppInit()
  return getAuth(app)
}

export function getFirebaseFirestore() {
  const app = firebaseAppInit()
  return getFirestore(app)
}

export function getFirebaseStorage() {
  const app = firebaseAppInit()
  return getStorage(app)
}



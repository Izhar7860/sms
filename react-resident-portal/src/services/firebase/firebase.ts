import { getFirebaseAuth } from './firebaseClient'
import { getFirebaseFirestore } from './firebaseClient'
import { getFirebaseStorage } from './firebaseClient'

export const firebaseAuth = () => getFirebaseAuth()
export const firebaseDb = () => getFirebaseFirestore()
export const firebaseStorage = () => getFirebaseStorage()


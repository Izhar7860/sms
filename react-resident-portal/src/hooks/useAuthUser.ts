import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getFirebaseAuth } from '../services/firebase/firebaseClient'

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const auth = getFirebaseAuth()
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })

      return () => unsub()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize Firebase Auth.')
      setLoading(false)
      return
    }
  }, [])

  return { user, loading, error }
}



import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getFirebaseAuth } from '../services/firebase/firebaseClient'


export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  return { user, loading }
}



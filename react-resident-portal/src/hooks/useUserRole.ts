import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { firebaseAppInit } from '../services/firebase/firebaseApp'
import { useAuthUser } from './useAuthUser'

export type Role = 'admin' | 'resident'

export function useUserRole() {
  const { user, loading: authLoading } = useAuthUser()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRole() {
      if (authLoading) return
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }


      try {
        // Role is expected in Firestore at: users/{uid}.role
        const db = getFirestore()
        const snap = await getDoc(doc(db, 'users', user.uid))
        const r = snap.exists() ? (snap.data()?.role as Role | undefined) : undefined
        setRole(r === 'admin' ? 'admin' : 'resident')
      } catch {
        // Safe fallback: treat user as resident.
        setRole('resident')
      } finally {
        setLoading(false)
      }
    }

    loadRole()
  }, [authLoading, user])

  return useMemo(() => ({ role, loading }), [role, loading])
}


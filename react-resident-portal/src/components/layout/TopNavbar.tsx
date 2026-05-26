import React from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useAuthUser } from '../../hooks/useAuthUser'
import { useUserRole } from '../../hooks/useUserRole'
import { getFirebaseAuth } from '../../services/firebase/firebaseClient'

export function TopNavbar() {
  const navigate = useNavigate()
  const { user, error } = useAuthUser()
  const { role } = useUserRole()

  async function onLogout() {
    try {
      const auth = getFirebaseAuth()
      await signOut(auth)
    } catch {
      // ignore
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <i className="fas fa-building" />
          </div>
          <div>
            <div className="text-sm font-semibold">Society Management System</div>
            <div className="text-xs text-gray-500">{role ? `${role[0].toUpperCase() + role.slice(1)} Portal` : 'Portal'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          {user?.email ? <span className="hidden sm:inline">{user.email}</span> : <span>Not signed in</span>}
          {user?.email && !error ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}


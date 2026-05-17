import React from 'react'
import { useAuthUser } from '../../hooks/useAuthUser'
import { useUserRole } from '../../hooks/useUserRole'

export function TopNavbar() {
  const { user } = useAuthUser()
  const { role } = useUserRole()


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

        <div className="text-xs text-gray-600">
          {user?.email ? <span>{user.email}</span> : <span>Not signed in</span>}
        </div>
      </div>
    </header>
  )
}


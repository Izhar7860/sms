import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser'
import { useUserRole } from '../../hooks/useUserRole'
import { FullPageSpinner } from '../ui/FullPageSpinner'

type Role = 'admin' | 'resident'

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[]
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuthUser()
  const { role, loading: roleLoading } = useUserRole()
  const location = useLocation()

  if (authLoading || roleLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/resident" replace />
  }

  return <>{children}</>
}


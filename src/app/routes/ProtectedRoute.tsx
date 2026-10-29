import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAuthSession } from '../../shared/auth/session'
import type { UserRole } from '../../features/auth/types/authTypes'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const session = getAuthSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />
  }

  return children
}

import type { UserRole } from '../../features/auth/types/authTypes'

const AUTH_STORAGE_KEY = 'smart-truck-parking.auth'

export type AuthSession = {
  token: string
  role: UserRole
  phone: string
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const session = JSON.parse(raw) as Partial<AuthSession>
    if (!session.token || !session.phone || !['DRIVER', 'MERCHANT', 'ADMIN'].includes(session.role ?? '')) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return session as AuthSession
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isDemoAuthSession(session: AuthSession | null = getAuthSession()) {
  return Boolean(session?.token.endsWith('-demo-token'))
}

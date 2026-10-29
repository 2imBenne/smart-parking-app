import type { UserRole } from '../../features/auth/types/authTypes'

export const roleHomePaths: Record<UserRole, string> = {
  DRIVER: '/dashboard',
  MERCHANT: '/merchant/dashboard',
  ADMIN: '/admin/dashboard',
}

export function getRoleHomePath(role: UserRole) {
  return roleHomePaths[role]
}

export const adminNavigationItems = [
  { key: '/admin/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { key: '/admin/parking-lots', label: 'Duyệt bãi đỗ', icon: 'parking' },
  { key: '/admin/users', label: 'Người dùng', icon: 'users' },
  { key: '/admin/transactions', label: 'Giao dịch', icon: 'transactions' },
  { key: '/admin/withdrawals', label: 'Rút tiền', icon: 'withdrawals' },
  { key: '/admin/disputes', label: 'Khiếu nại', icon: 'disputes' },
  { key: '/admin/audit-logs', label: 'Audit log', icon: 'audit' },
  { key: '/admin/notifications', label: 'Thông báo', icon: 'notifications' },
] as const

export const adminBreadcrumbLabels: Record<string, string> = {
  admin: 'Quản trị', dashboard: 'Tổng quan', 'parking-lots': 'Duyệt bãi đỗ', users: 'Người dùng', transactions: 'Giao dịch', withdrawals: 'Rút tiền', disputes: 'Khiếu nại', 'audit-logs': 'Audit log', notifications: 'Thông báo', profile: 'Hồ sơ',
}

export type AdminNavigationIcon = typeof adminNavigationItems[number]['icon']

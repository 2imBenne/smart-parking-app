export type MerchantNavigationItem = {
  key: string
  label: string
  icon: 'dashboard' | 'parking' | 'booking' | 'qr' | 'revenue' | 'withdrawal' | 'profile' | 'dispute' | 'notification'
  blockedByBackend?: boolean
}

export const merchantNavigationItems: MerchantNavigationItem[] = [
  { key: '/merchant/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { key: '/merchant/parking-lots', label: 'Bãi đỗ', icon: 'parking' },
  { key: '/merchant/bookings', label: 'Booking', icon: 'booking' },
  { key: '/merchant/qr-scanner', label: 'Quét QR', icon: 'qr' },
  { key: '/merchant/revenue', label: 'Doanh thu', icon: 'revenue' },
  { key: '/merchant/withdrawals', label: 'Rút tiền', icon: 'withdrawal' },
  { key: '/merchant/profile', label: 'Hồ sơ', icon: 'profile' },
  { key: '/merchant/disputes', label: 'Tranh chấp', icon: 'dispute' },
  { key: '/merchant/notifications', label: 'Thông báo', icon: 'notification' },
]

export const merchantBreadcrumbLabels: Record<string, string> = {
  merchant: 'Merchant',
  dashboard: 'Tổng quan',
  profile: 'Hồ sơ',
  'parking-lots': 'Bãi đỗ',
  new: 'Tạo mới',
  edit: 'Chỉnh sửa',
  slots: 'Sức chứa',
  pricing: 'Bảng giá',
  bookings: 'Booking',
  'qr-scanner': 'Quét QR',
  revenue: 'Doanh thu',
  withdrawals: 'Rút tiền',
  disputes: 'Tranh chấp',
  notifications: 'Thông báo',
}

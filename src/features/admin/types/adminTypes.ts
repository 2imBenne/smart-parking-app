export type AdminParkingStatus = 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export type AdminParkingLotImage = {
  id: number
  originalFileName: string
  contentType: string
  sizeBytes: number
  cover: boolean
  contentUrl: string
}
export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'LOCKED'
export type AdminTransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'
export type AdminTransactionType = 'DEPOSIT' | 'FINAL_PAYMENT' | 'OVERTIME_FEE' | 'REFUND' | 'WITHDRAWAL'
export type AdminWithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type AdminDisputeStatus = 'OPEN' | 'IN_REVIEW' | 'WAITING_EVIDENCE' | 'RESOLVED' | 'CLOSED'

export type AdminParkingLot = {
  id: number
  name: string
  merchantName: string
  merchantPhone: string
  address: string
  submittedAt: string
  status: AdminParkingStatus
  vehicleTypes: string[]
  totalCapacity: number
  imageCount: number
  images: AdminParkingLotImage[]
  documentsComplete: boolean
  latitude: number
  longitude: number
  description: string
  reviewNote?: string
}

export type AdminUser = {
  id: number
  fullName: string
  phone: string
  role: 'DRIVER' | 'MERCHANT' | 'ADMIN'
  status: AdminUserStatus
  createdAt: string
  lastLoginAt?: string
  activityCount?: number
  disputeCount?: number
  statusReason?: string
}

export type AdminTransaction = {
  id: number
  code: string
  bookingCode: string
  payerName: string
  merchantName: string
  type: AdminTransactionType
  amount: number
  status: AdminTransactionStatus
  gateway: string
  createdAt: string
}

export type AdminWithdrawal = {
  id: number
  code: string
  merchantName: string
  merchantPhone: string
  amount: number
  availableBalance: number
  bankName: string
  bankAccount: string
  status: AdminWithdrawalStatus
  requestedAt: string
  reviewNote?: string
}

export type AdminDispute = {
  id: number
  code: string
  title: string
  reporterName: string
  reporterRole: 'DRIVER' | 'MERCHANT'
  bookingCode: string
  parkingLotName: string
  amount: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: AdminDisputeStatus
  createdAt: string
  description: string
  evidenceCount: number
  resolution?: string
}

export type AdminAuditLog = {
  id: number
  actor: string
  action: string
  entityType: string
  entityId: number
  result: 'SUCCESS' | 'FAILED'
  createdAt: string
  detail: string
}

export type AdminNotification = {
  id: number
  title: string
  content: string
  createdAt: string
  read: boolean
  path: string
}

export type AdminDashboardSummary = {
  totalUsers: number
  totalDrivers: number
  totalMerchants: number
  totalParkingLots: number
  pendingParkingLots: number
  totalBookings: number
  successfulRevenue: number
}

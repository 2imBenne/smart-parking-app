import { apiClient } from '../../../shared/api/apiClient'
import { env } from '../../../app/env'
import type { ApiResponse } from '../../../shared/api/types'
import type {
  AdminAuditLog,
  AdminDashboardSummary,
  AdminDispute,
  AdminDisputeStatus,
  AdminNotification,
  AdminParkingLot,
  AdminParkingStatus,
  AdminTransaction,
  AdminUser,
  AdminUserStatus,
  AdminWithdrawal,
  AdminWithdrawalStatus,
} from '../types/adminTypes'

type BackendPage<T> = {
  content: T[]
  currentPage: number
  totalElements: number
  totalPages: number
}

type BackendDashboard = {
  totalUsers: number
  totalDrivers: number
  totalMerchants: number
  totalParkingLots: number
  pendingParkingLots: number
  totalBookings: number
  platformRevenue: number
}

type BackendAdminParkingLot = {
  id: number
  merchantId: number
  name: string
  address: string
  latitude: number
  longitude: number
  status: AdminParkingStatus
  createdAt: string
}

type BackendSlot = {
  totalCapacity: number
  vehicleType: string
}

type BackendParkingLotDetail = Omit<BackendAdminParkingLot, 'createdAt'> & {
  merchantName: string
  merchantPhone?: string
  reviewReason?: string
  images?: Array<{
    id: number
    originalFileName: string
    contentType: string
    sizeBytes: number
    cover: boolean
    contentUrl: string
  }>
  slots?: BackendSlot[]
  pricingRules?: Array<{ vehicleType: string }>
}

type BackendAdminUser = {
  id: number
  phone: string
  email?: string | null
  role: AdminUser['role']
  status: AdminUserStatus
  createdAt: string
}
type BackendAdminUserDetail = BackendAdminUser & { fullName?: string | null; statusReason?: string; bookingCount:number; disputeCount:number }

type BackendWithdrawal = {
  id: number
  merchantId: number
  merchantName?: string | null
  merchantPhone?: string | null
  amount: number
  availableBalance: number
  bankName?: string | null
  maskedBankAccount?: string | null
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  requestedAt: string
  decisionReason?: string
}

type BackendAuditLog = {
  id: number
  actorUserId: number
  action: string
  targetType: string
  targetId: number
  createdAt: string
}
type BackendTransaction = { id:number; transactionCode:string; bookingCode:string; payerPhone:string; merchantName?:string; type:AdminTransaction['type']; amount:number; status:AdminTransaction['status']; gateway:string; createdAt:string }
type BackendDispute = { id:number; reason:string; description:string; status:'PENDING'|'REVIEWING'|'RESOLVED'|'REJECTED'; resolution?:string; createdAt:string; bookingCode:string; driverPhone:string; parkingLotName:string; payments:Array<{amount:number}> }
const disputeFromBackend = (item: BackendDispute): AdminDispute => ({ id:item.id, code:`DSP-${item.id}`, title:item.reason, reporterName:item.driverPhone, reporterRole:'DRIVER', bookingCode:item.bookingCode, parkingLotName:item.parkingLotName, amount:item.payments.reduce((sum,payment)=>sum+payment.amount,0), priority:'MEDIUM', status:item.status==='PENDING'?'OPEN':item.status==='REVIEWING'?'IN_REVIEW':item.status==='REJECTED'?'CLOSED':'RESOLVED', createdAt:item.createdAt, description:item.description, evidenceCount:0, resolution:item.resolution })

type BackendNotification = {
  id: number
  title: string
  content: string
  type: string
  readAt: string | null
  createdAt: string
}

const parkingFromList = (item: BackendAdminParkingLot): AdminParkingLot => ({
  id: item.id,
  name: item.name,
  merchantName: `Merchant #${item.merchantId}`,
  merchantPhone: '',
  address: item.address,
  submittedAt: item.createdAt,
  status: item.status,
  vehicleTypes: [],
  totalCapacity: 0,
  imageCount: 0,
  images: [],
  documentsComplete: false,
  latitude: item.latitude,
  longitude: item.longitude,
  description: '',
})

const parkingFromDetail = (item: BackendParkingLotDetail, createdAt = ''): AdminParkingLot => {
  const slots = item.slots ?? []
  const types = slots.length
    ? slots.map(slot => slot.vehicleType)
    : (item.pricingRules ?? []).map(rule => rule.vehicleType)

  return {
    id: item.id,
    name: item.name,
    merchantName: item.merchantName || `Merchant #${item.merchantId}`,
    merchantPhone: item.merchantPhone ?? '',
    address: item.address,
    submittedAt: createdAt,
    status: item.status,
    vehicleTypes: [...new Set(types)],
    totalCapacity: slots.reduce((sum, slot) => sum + slot.totalCapacity, 0),
    imageCount: item.images?.length ?? 0,
    images: (item.images ?? []).map(image => ({
      ...image,
      contentUrl: new URL(image.contentUrl, env.VITE_API_URL).toString(),
    })),
    documentsComplete: false,
    latitude: item.latitude,
    longitude: item.longitude,
    description: '',
    reviewNote: item.reviewReason,
  }
}

const userFromBackend = (item: BackendAdminUser): AdminUser => ({
  id: item.id,
  fullName: item.email || item.phone,
  phone: item.phone,
  role: item.role,
  status: item.status,
  createdAt: item.createdAt,
})

const withdrawalFromBackend = (item: BackendWithdrawal): AdminWithdrawal => ({
  id: item.id,
  code: `WD-${item.id}`,
  merchantName: item.merchantName || `Merchant #${item.merchantId}`,
  merchantPhone: item.merchantPhone ?? '',
  amount: item.amount,
  availableBalance: item.availableBalance,
  bankName: item.bankName ?? '',
  bankAccount: item.maskedBankAccount ?? '',
  status: item.status === 'PAID' ? 'APPROVED' : item.status,
  requestedAt: item.requestedAt,
  reviewNote: item.decisionReason,
})

export const adminRepository = {
  async dashboard(): Promise<AdminDashboardSummary> {
    const response = await apiClient.get<ApiResponse<BackendDashboard>>('/api/v1/admin/dashboard')
    const data = response.data.data
    return {
      totalUsers: data.totalUsers,
      totalDrivers: data.totalDrivers,
      totalMerchants: data.totalMerchants,
      totalParkingLots: data.totalParkingLots,
      pendingParkingLots: data.pendingParkingLots,
      totalBookings: data.totalBookings,
      successfulRevenue: data.platformRevenue,
    }
  },

  async parkingLots(): Promise<AdminParkingLot[]> {
    const response = await apiClient.get<ApiResponse<BackendPage<BackendAdminParkingLot>>>('/api/v1/admin/parking-lots', {
      params: { page: 0, size: 100, sort: 'id,desc' },
    })
    return Promise.all(response.data.data.content.map(async item => {
      try {
        const detail = await apiClient.get<ApiResponse<BackendParkingLotDetail>>(`/api/v1/admin/parking-lots/${item.id}`)
        return parkingFromDetail(detail.data.data, item.createdAt)
      } catch {
        return parkingFromList(item)
      }
    }))
  },

  async parkingLot(id: number): Promise<AdminParkingLot> {
    const [detailResponse, listResponse] = await Promise.all([
      apiClient.get<ApiResponse<BackendParkingLotDetail>>(`/api/v1/admin/parking-lots/${id}`),
      apiClient.get<ApiResponse<BackendPage<BackendAdminParkingLot>>>('/api/v1/admin/parking-lots', {
        params: { page: 0, size: 100, sort: 'id,desc' },
      }),
    ])
    const listItem = listResponse.data.data.content.find(item => item.id === id)
    return parkingFromDetail(detailResponse.data.data, listItem?.createdAt)
  },

  async decideParkingLot(id: number, status: Exclude<AdminParkingStatus, 'PENDING_APPROVAL'>, _note: string): Promise<AdminParkingLot> {
    void _note
    const action =
      status === 'APPROVED' ? 'approve' : status === 'CHANGES_REQUESTED' ? 'request-changes' : 'reject'
    await apiClient.put(`/api/v1/admin/parking-lots/${id}/${action}`, { reason: _note })
    return this.parkingLot(id)
  },

  async users(): Promise<AdminUser[]> {
    const response = await apiClient.get<ApiResponse<BackendPage<BackendAdminUser>>>('/api/v1/admin/users', { params: { page: 0, size: 200 } })
    return response.data.data.content.map(userFromBackend)
  },

  async user(id: number): Promise<AdminUser> {
    const response=await apiClient.get<ApiResponse<BackendAdminUserDetail>>(`/api/v1/admin/users/${id}`)
    const item=userFromBackend(response.data.data)
    return {...item,fullName:response.data.data.fullName||item.fullName,activityCount:response.data.data.bookingCount,disputeCount:response.data.data.disputeCount,statusReason:response.data.data.statusReason}
  },

  async setUserStatus(id: number, status: AdminUserStatus, _reason: string): Promise<AdminUser> {
    await apiClient.put(`/api/v1/admin/users/${id}/${status === 'ACTIVE' ? 'unban' : 'ban'}`, { reason: _reason })
    return this.user(id)
  },

  async transactions(): Promise<AdminTransaction[]> {
    const response=await apiClient.get<ApiResponse<BackendPage<BackendTransaction>>>('/api/v1/admin/transactions',{params:{page:0,size:200}})
    return response.data.data.content.map(item=>({id:item.id,code:item.transactionCode,bookingCode:item.bookingCode,payerName:item.payerPhone,merchantName:item.merchantName??'—',type:item.type,amount:item.amount,status:item.status,gateway:item.gateway,createdAt:item.createdAt}))
  },

  async withdrawals(): Promise<AdminWithdrawal[]> {
    const response = await apiClient.get<ApiResponse<BackendPage<BackendWithdrawal>>>('/api/v1/admin/withdrawals', { params: { page: 0, size: 200 } })
    return response.data.data.content.map(withdrawalFromBackend)
  },

  async decideWithdrawal(id: number, status: Exclude<AdminWithdrawalStatus, 'PENDING'>, _note: string): Promise<AdminWithdrawal> {
    void _note
    await apiClient.put(`/api/v1/admin/withdrawals/${id}/${status === 'APPROVED' ? 'approve' : 'reject'}`, { reason: _note })
    const item = (await this.withdrawals()).find(withdrawal => withdrawal.id === id)
    if (!item) throw new Error('Không tìm thấy yêu cầu rút tiền.')
    return item
  },

  async disputes(): Promise<AdminDispute[]> {
    const response=await apiClient.get<ApiResponse<BackendPage<BackendDispute>>>('/api/v1/disputes/admin',{params:{page:0,size:200}})
    return response.data.data.content.map(disputeFromBackend)
  },

  async dispute(id: number): Promise<AdminDispute> {
    const response=await apiClient.get<ApiResponse<BackendDispute>>(`/api/v1/disputes/admin/${id}`)
    return disputeFromBackend(response.data.data)
  },

  async resolveDispute(id: number, _status: AdminDisputeStatus, resolution: string): Promise<AdminDispute> {
    const response=await apiClient.put<ApiResponse<BackendDispute>>(`/api/v1/disputes/${id}/resolve`,{resolution})
    return disputeFromBackend(response.data.data)
  },

  async auditLogs(): Promise<AdminAuditLog[]> {
    const response = await apiClient.get<ApiResponse<BackendPage<BackendAuditLog>>>('/api/v1/admin/audit-logs', { params: { page: 0, size: 200 } })
    return response.data.data.content.map(item => ({
      id: item.id,
      actor: `User #${item.actorUserId}`,
      action: item.action,
      entityType: item.targetType,
      entityId: item.targetId,
      result: 'SUCCESS',
      createdAt: item.createdAt,
      detail: '',
    }))
  },

  async notifications(): Promise<AdminNotification[]> {
    const response = await apiClient.get<ApiResponse<BackendPage<BackendNotification>>>('/api/v1/notifications', { params: { page: 0, size: 100 } })
    return response.data.data.content.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      read: Boolean(item.readAt),
      path: '/admin/notifications',
    }))
  },

  async markNotification(id?: number): Promise<void> {
    await apiClient.post(id ? `/api/v1/notifications/${id}/read` : '/api/v1/notifications/read-all')
  },
}

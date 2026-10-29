export type MerchantDisputeStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'

export type MerchantDispute = {
  id: number
  bookingId: number
  bookingCode: string
  parkingLotName?: string | null
  driverPhone?: string | null
  reason: string
  description?: string | null
  status: MerchantDisputeStatus
  resolution?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  refundAmount?: number | null
}

export type MerchantDisputePage = {
  content: MerchantDispute[]
  currentPage: number
  totalPages: number
  totalElements: number
}

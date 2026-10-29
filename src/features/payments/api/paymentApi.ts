import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse, PageResponse } from '../../../shared/api/types'

export type PaymentDto = {
  id: number
  bookingId: number
  bookingCode: string
  gateway: string
  transactionCode: string
  amount: number
  type: string
  status: string
  createdAt: string | number[]
  paidAt?: string | number[] | null
}

export type PaymentPage = PageResponse<PaymentDto>

export const getMyPayments = async (page = 0, size = 20): Promise<PaymentPage> => {
  const response = await apiClient.get<ApiResponse<PaymentPage>>('/api/v1/payments', { params: { page, size } })
  const data = response.data.data
  return {
    ...data,
    content: (data?.content ?? []).map((p) => ({
      ...p,
      bookingCode: p.bookingCode || (p.bookingId ? `BK-${p.bookingId}` : '—'),
      transactionCode: p.transactionCode || 'N/A',
    })),
  }
}

import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/api/types'

export type RevenueGranularity = 'DAY' | 'MONTH' | 'YEAR'

export type RevenueSeriesPoint = {
  period: string
  revenue: number
  bookingCount: number
}

export type MerchantRevenue = {
  totalRevenue: number
  completedBookings: number
  walletBalance?: number
  totalPlatformFee?: number
  platformFeePercent?: number
  minWithdrawalAmount?: number
  series?: RevenueSeriesPoint[]
}

export async function getMerchantRevenue(
  startDate?: string,
  endDate?: string,
  granularity: RevenueGranularity = 'DAY',
): Promise<MerchantRevenue> {
  const response = await apiClient.get<ApiResponse<MerchantRevenue>>('/api/v1/merchant/revenue', {
    params: { startDate, endDate, granularity },
  })
  return response.data.data
}

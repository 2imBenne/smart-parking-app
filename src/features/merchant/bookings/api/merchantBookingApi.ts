import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { BookingDto } from '../../../bookings/types/bookingTypes'

export type MerchantBookingPage = {
  content: BookingDto[]
  currentPage: number
  totalPages: number
  totalElements: number
}

export async function getMerchantBookings(page = 0, size = 20, parkingLotId?: number): Promise<MerchantBookingPage> {
  const response = await apiClient.get<ApiResponse<MerchantBookingPage>>('/api/v1/merchant/bookings', {
    params: { page, size, sort: 'createdAt,desc', parkingLotId },
  })
  return response.data.data
}

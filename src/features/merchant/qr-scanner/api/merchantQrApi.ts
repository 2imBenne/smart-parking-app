import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { CheckInRequest, CheckOutResponse } from '../types/merchantQrTypes'

export async function merchantCheckIn(request: CheckInRequest) {
  await apiClient.post<ApiResponse<null>>('/api/v1/merchant/check-in', request)
}

export async function merchantCheckOut(request: CheckInRequest) {
  const response = await apiClient.post<ApiResponse<CheckOutResponse>>('/api/v1/merchant/check-out', request)
  return response.data.data
}

export async function confirmCashPayment(request: CheckInRequest) {
  const response = await apiClient.post<ApiResponse<CheckOutResponse>>('/api/v1/merchant/confirm-cash', request)
  return response.data.data
}

import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { CreateWithdrawalRequest, WithdrawalResponse } from '../types/merchantWithdrawalTypes'

export type WithdrawalPage = {
  content: WithdrawalResponse[]
  currentPage: number
  totalPages: number
  totalElements: number
}

export async function createWithdrawal(request: CreateWithdrawalRequest) {
  const response = await apiClient.post<ApiResponse<WithdrawalResponse>>('/api/v1/withdrawals', request)
  return response.data.data
}

export async function getMyWithdrawals(page = 0, size = 20) {
  const response = await apiClient.get<ApiResponse<WithdrawalPage>>('/api/v1/withdrawals', {
    params: { page, size },
  })
  return response.data.data
}

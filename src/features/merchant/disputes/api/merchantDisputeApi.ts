import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { MerchantDispute, MerchantDisputePage } from '../types/merchantDisputeTypes'

export type MerchantDisputeListParams = {
  page: number
  size: number
}

export async function getMerchantDisputes(params: MerchantDisputeListParams) {
  const response = await apiClient.get<ApiResponse<MerchantDisputePage>>('/api/v1/disputes/merchant', { params })
  return response.data.data
}

export async function getMerchantDisputeDetail(disputeId: number) {
  const response = await apiClient.get<ApiResponse<MerchantDispute>>(`/api/v1/disputes/${disputeId}`)
  return response.data.data
}

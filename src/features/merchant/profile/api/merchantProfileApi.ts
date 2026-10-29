import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { MerchantProfile, UpdateMerchantProfileRequest } from '../types/merchantProfileTypes'

export async function getMerchantProfile() {
  const response = await apiClient.get<ApiResponse<MerchantProfile>>('/api/v1/merchant/profile')
  return response.data.data
}

export async function updateMerchantProfile(request: UpdateMerchantProfileRequest) {
  const response = await apiClient.put<ApiResponse<MerchantProfile>>('/api/v1/merchant/profile', request)
  return response.data.data
}

export async function uploadMerchantDocument(payload: { businessLicense?: string; file?: File | null }) {
  const form = new FormData()
  if (payload.businessLicense?.trim()) form.append('businessLicense', payload.businessLicense.trim())
  if (payload.file) form.append('file', payload.file)
  const response = await apiClient.post<ApiResponse<MerchantProfile>>('/api/v1/merchant/profile/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/api/types'

export type UserProfileDto = {
  fullName: string
  phone: string
  email?: string
  emergencyContact?: string
  address?: string
}

export const getProfile = async () => {
  const response = await apiClient.get<ApiResponse<UserProfileDto>>('/api/v1/users/me')
  return response.data.data
}

export const updateProfile = async (data: UserProfileDto) => {
  const response = await apiClient.put<ApiResponse<UserProfileDto>>('/api/v1/users/me', data)
  return response.data.data
}

export const changePassword = async (data: Record<string, unknown>) => {
  await apiClient.post('/api/v1/users/me/password', data)
}

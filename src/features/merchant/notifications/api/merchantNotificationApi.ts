import { apiClient } from '../../../../shared/api/apiClient'
import type { ApiResponse } from '../../../../shared/api/types'
import type { MerchantNotificationPage } from '../types/merchantNotificationTypes'

export async function getMerchantNotifications(page: number, size: number) {
  const response = await apiClient.get<ApiResponse<MerchantNotificationPage>>('/api/v1/notifications', { params: { page, size } })
  return response.data.data
}

export async function getMerchantUnreadNotificationCount() {
  const response = await apiClient.get<ApiResponse<number>>('/api/v1/notifications/unread-count')
  return response.data.data
}

export async function markMerchantNotificationAsRead(id: number) {
  await apiClient.post<ApiResponse<void>>(`/api/v1/notifications/${id}/read`)
}

export async function markAllMerchantNotificationsAsRead() {
  await apiClient.post<ApiResponse<void>>('/api/v1/notifications/read-all')
}

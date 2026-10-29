import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse, PageResponse } from '../../../shared/api/types'
import type { BookingDto } from '../../bookings/types/bookingTypes'

export type QueueDto = {
  id: number
  parkingLotId: number
  parkingLotName: string
  vehicleId: number
  vehicleLicensePlate?: string
  licensePlate?: string
  vehicleType: string
  position: number
  peopleAhead?: number
  estimatedWaitMinutes?: number
  status: 'WAITING' | 'NOTIFIED' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED'
  joinedAt: string
  responseDeadline?: string
}

export type QueuePage = PageResponse<QueueDto>

export const getMyQueues = async (page = 0, size = 20): Promise<QueueDto[]> => {
  try {
    const response = await apiClient.get<ApiResponse<QueuePage | QueueDto | QueueDto[]>>('/api/v1/queues', { params: { page, size } })
    const data = response.data.data
    if (!data) return []
    const rawList: QueueDto[] = Array.isArray(data)
      ? data
      : typeof data === 'object' && 'content' in data && Array.isArray((data as QueuePage).content)
        ? (data as QueuePage).content
        : [data as QueueDto]
    return rawList.map((item) => ({
      ...item,
      parkingLotName: item.parkingLotName || `Bãi đỗ xe #${item.parkingLotId}`,
      vehicleLicensePlate: item.vehicleLicensePlate ?? item.licensePlate ?? '',
    }))
  } catch {
    try {
      const fallback = await apiClient.get<ApiResponse<QueueDto | null>>('/api/v1/queues/me')
      const item = fallback.data.data
      if (!item) return []
      return [{
        ...item,
        parkingLotName: item.parkingLotName || `Bãi đỗ xe #${item.parkingLotId}`,
        vehicleLicensePlate: item.vehicleLicensePlate ?? item.licensePlate ?? '',
      }]
    } catch {
      return []
    }
  }
}

export const joinQueue = async (request: { parkingLotId: number; vehicleId: number; vehicleType: string }) => {
  const response = await apiClient.post<ApiResponse<QueueDto>>('/api/v1/queues', request)
  return response.data.data
}

export const leaveQueue = async (queueId: number) => {
  await apiClient.post(`/api/v1/queues/${queueId}/leave`)
}

export const acceptQueue = async (queueId: number) => {
  const response = await apiClient.post<ApiResponse<BookingDto>>(`/api/v1/queues/${queueId}/accept`)
  return response.data.data
}

export const declineQueue = async (queueId: number) => {
  await apiClient.post(`/api/v1/queues/${queueId}/decline`)
}

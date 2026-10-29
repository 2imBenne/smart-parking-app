import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse, PageResponse } from '../../../shared/api/types'
import type { BackendNotification, NotificationItem, NotificationKind } from '../types/notificationTypes'

export type NotificationPage = PageResponse<NotificationItem>

type BackendNotificationPage = {
  content: BackendNotification[]
  totalElements?: number
  totalPages?: number
  pageNumber?: number
  pageSize?: number
  currentPage?: number
}

export const getMyNotifications = async (page = 0, size = 20) => {
  const response = await apiClient.get<ApiResponse<BackendNotificationPage>>('/api/v1/notifications', {
    params: { page, size },
  })
  const data = response.data.data
  return {
    content: (data.content ?? []).map(mapNotification),
    totalElements: data.totalElements ?? data.content?.length ?? 0,
    totalPages: data.totalPages ?? 1,
    pageNumber: data.pageNumber ?? data.currentPage ?? page,
    pageSize: data.pageSize ?? size,
  } satisfies NotificationPage
}

export const getUnreadCount = async () => {
  const response = await apiClient.get<ApiResponse<number>>('/api/v1/notifications/unread-count')
  return response.data.data
}

export const markAsRead = async (id: number) => {
  await apiClient.post(`/api/v1/notifications/${id}/read`)
}

export const markAllAsRead = async () => {
  await apiClient.post(`/api/v1/notifications/read-all`)
}

function mapNotification(item: BackendNotification): NotificationItem {
  const kind = toKind(item.type)
  const route = resolveAction(item.targetType, item.targetId, kind)
  return {
    id: item.id,
    kind,
    title: item.title || 'Thông báo',
    content: item.content || '',
    timeLabel: formatTimeLabel(item.createdAt),
    read: Boolean(item.readAt),
    actionLabel: route ? 'Xem chi tiết' : undefined,
    actionPath: route,
    createdAt: item.createdAt,
    targetType: item.targetType,
    targetId: item.targetId,
  }
}

function toKind(type?: string): NotificationKind {
  const value = (type || 'SYSTEM').toUpperCase()
  if (value === 'BOOKING' || value === 'PAYMENT' || value === 'QUEUE' || value === 'SYSTEM' || value === 'VEHICLE') {
    return value
  }
  return 'SYSTEM'
}

function resolveAction(targetType?: string | null, targetId?: number | null, kind?: NotificationKind): string | undefined {
  if (targetType === 'BOOKING' && targetId) return '/bookings'
  if (targetType === 'PAYMENT' && targetId) return '/payments'
  if (targetType === 'QUEUE') return '/queues'
  if (targetType === 'WITHDRAWAL') return '/payments'
  if (targetType === 'PARKING_LOT' && targetId) return '/parking'
  if (targetType === 'DISPUTE') return '/bookings'
  if (kind === 'BOOKING') return '/bookings'
  if (kind === 'PAYMENT') return '/payments'
  if (kind === 'QUEUE') return '/queues'
  return undefined
}

function parseDate(value?: string | number[] | null): Date | null {
  if (value == null || value === '') return null
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = value
    if (y == null || m == null || d == null) return null
    const date = new Date(y, m - 1, d, h, mi, Math.floor(Number(s)))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const raw = String(value).trim()
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatTimeLabel(value?: string | number[] | null): string {
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

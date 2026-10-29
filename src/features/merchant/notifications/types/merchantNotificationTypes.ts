export type MerchantNotificationType = 'BOOKING' | 'PAYMENT' | 'QUEUE' | 'SYSTEM'

export type MerchantNotification = {
  id: number
  title: string
  content: string
  type: MerchantNotificationType
  readAt?: string | null
  createdAt: string
  targetType?: string | null
  targetId?: number | null
}

export type MerchantNotificationPage = {
  content: MerchantNotification[]
  currentPage: number
  totalPages: number
  totalElements: number
}

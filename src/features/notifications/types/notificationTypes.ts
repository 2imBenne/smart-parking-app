export type NotificationKind = 'BOOKING' | 'PAYMENT' | 'QUEUE' | 'SYSTEM' | 'VEHICLE'

export type NotificationItem = {
  id: number
  kind: NotificationKind
  title: string
  content: string
  timeLabel: string
  read: boolean
  actionLabel?: string
  actionPath?: string
  createdAt?: string | number[] | null
  targetType?: string | null
  targetId?: number | null
}

export type BackendNotification = {
  id: number
  title: string
  content: string
  type: string
  readAt?: string | number[] | null
  createdAt?: string | number[] | null
  targetType?: string | null
  targetId?: number | null
}

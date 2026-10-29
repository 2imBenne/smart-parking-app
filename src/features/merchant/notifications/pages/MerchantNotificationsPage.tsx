import { BellOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Empty, List, Skeleton, Tag, message } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import {
  getMerchantNotifications,
  getMerchantUnreadNotificationCount,
  markAllMerchantNotificationsAsRead,
  markMerchantNotificationAsRead,
} from '../api/merchantNotificationApi'
import type { MerchantNotification, MerchantNotificationPage } from '../types/merchantNotificationTypes'

const typeColors: Record<MerchantNotification['type'], string> = {
  BOOKING: 'blue',
  PAYMENT: 'green',
  QUEUE: 'gold',
  SYSTEM: 'default',
}

export function MerchantNotificationsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MerchantNotificationPage>({ content: [], currentPage: 0, totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [readingIds, setReadingIds] = useState<Set<number>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [notifications, count] = await Promise.all([
        getMerchantNotifications(page, size),
        getMerchantUnreadNotificationCount(),
      ])
      setData(notifications)
      setUnreadCount(count)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setData((current) => ({ ...current, content: [] }))
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(loadTimer)
  }, [load])

  const markRead = async (item: MerchantNotification, navigateAfterRead: boolean) => {
    if (readingIds.has(item.id)) return
    setReadingIds((current) => new Set(current).add(item.id))
    try {
      if (!item.readAt) {
        await markMerchantNotificationAsRead(item.id)
        setData((current) => ({
          ...current,
          content: current.content.map((notification) => notification.id === item.id
            ? { ...notification, readAt: new Date().toISOString() }
            : notification),
        }))
        setUnreadCount((current) => Math.max(0, current - 1))
      }

      const route = getMerchantNotificationRoute(item)
      if (navigateAfterRead && route) navigate(route)
      if (navigateAfterRead && !route && item.targetType) message.info('Thông báo đã được đánh dấu đã đọc.')
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setReadingIds((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  const markAll = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await markAllMerchantNotificationsAsRead()
      const readAt = new Date().toISOString()
      setData((current) => ({ ...current, content: current.content.map((item) => ({ ...item, readAt: item.readAt ?? readAt })) }))
      setUnreadCount(0)
      message.success('Đã đánh dấu tất cả thông báo là đã đọc.')
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setMarkingAll(false)
    }
  }

  return <main className="merchant-page-stack">
    <header className="merchant-page-header">
        <div><h1>Thông báo</h1><p>Theo dõi cập nhật duyệt bãi, rút tiền, tranh chấp và hệ thống.</p></div>
      <div className="merchant-header-actions">
        <Badge count={unreadCount} showZero><Button icon={<BellOutlined />}>Chưa đọc</Button></Badge>
        <Button type="primary" icon={<CheckCircleOutlined />} loading={markingAll} disabled={markingAll || unreadCount === 0} onClick={() => void markAll()}>Đánh dấu tất cả đã đọc</Button>
      </div>
    </header>
    {error && <Alert type="error" showIcon message="Không tải được thông báo" description={error} action={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Thử lại</Button>} />}
    <section className="merchant-list-card">
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : data.content.length ? <List
        itemLayout="vertical"
        dataSource={data.content}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data.totalElements,
          showSizeChanger: false,
          onChange: (nextPage) => setPage(nextPage - 1),
        }}
        renderItem={(item) => {
          const unread = !item.readAt
          const route = getMerchantNotificationRoute(item)
          return <List.Item
            actions={[
              <Button key="read" type="link" loading={readingIds.has(item.id)} disabled={readingIds.has(item.id) || !unread} onClick={() => void markRead(item, false)}>
                {unread ? 'Đánh dấu đã đọc' : 'Đã đọc'}
              </Button>,
              <Button key="open" type="link" loading={readingIds.has(item.id)} disabled={readingIds.has(item.id)} onClick={() => void markRead(item, Boolean(route))}>
                {route ? 'Mở liên quan' : 'Không có điều hướng'}
              </Button>,
            ]}
            className={unread ? 'merchant-notification-unread' : undefined}
          >
            <List.Item.Meta
              avatar={<Badge status={unread ? 'processing' : 'default'} />}
              title={<span><Tag color={typeColors[item.type]}>{item.type}</Tag>{item.title}</span>}
              description={<span>{formatDate(item.createdAt)}{item.targetType ? ` · ${item.targetType}${item.targetId ? ` #${item.targetId}` : ''}` : ''}</span>}
            />
            <p>{item.content}</p>
          </List.Item>
        }}
      /> : <Empty description="Bạn chưa có thông báo nào" />}
    </section>
  </main>
}

function getMerchantNotificationRoute(item: Pick<MerchantNotification, 'targetType' | 'targetId'>) {
  if (!item.targetType || !item.targetId) return undefined
  if (item.targetType === 'PARKING_LOT') return `/merchant/parking-lots/${item.targetId}`
  if (item.targetType === 'DISPUTE') return `/merchant/disputes/${item.targetId}`
  if (item.targetType === 'WITHDRAWAL') return '/merchant/withdrawals'
  return undefined
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

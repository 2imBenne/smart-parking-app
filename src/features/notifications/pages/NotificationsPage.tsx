import { AlertTriangle, CircleParking, Info, List, ReceiptText } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Empty, Segmented, Skeleton } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getMyNotifications, markAsRead, markAllAsRead } from '../api/notificationApi'
import type { NotificationItem, NotificationKind } from '../types/notificationTypes'

const icons: Record<NotificationKind, ReactNode> = {
  BOOKING: <CircleParking />,
  VEHICLE: <AlertTriangle />,
  PAYMENT: <ReceiptText />,
  QUEUE: <List />,
  SYSTEM: <Info />,
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyNotifications()
      setItems(data.content ?? [])
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => (filter === 'UNREAD' ? items.filter((item) => !item.read) : items),
    [filter, items],
  )
  const unread = items.filter((item) => !item.read).length

  const mark = async (id?: number) => {
    if (id) {
      await markAsRead(id)
    } else {
      await markAllAsRead()
    }
    await load()
  }

  const open = async (item: NotificationItem) => {
    if (!item.read) {
      await mark(item.id)
    }
    if (item.actionPath) navigate(item.actionPath)
  }

  return (
    <main className="notifications-page stitch-section">
      <div className="notifications-heading">
        <div>
          <span>TRUNG TÂM THÔNG BÁO</span>
          <h1>Thông báo</h1>
          <p>Cập nhật booking, thanh toán, phương tiện và hàng đợi.</p>
        </div>
        <button onClick={() => void mark()} disabled={!unread}>
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      <div className="notification-toolbar">
        <Segmented
          value={filter}
          onChange={(value) => setFilter(value as 'ALL' | 'UNREAD')}
          options={[
            { label: `Tất cả (${items.length})`, value: 'ALL' },
            { label: `Chưa đọc (${unread})`, value: 'UNREAD' },
          ]}
        />
      </div>
      {loading ? (
        <Skeleton active />
      ) : !visible.length ? (
        <Empty
          description={
            filter === 'UNREAD' ? 'Bạn đã đọc tất cả thông báo' : 'Bạn chưa có thông báo'
          }
        />
      ) : (
        <div className="notification-list">
          {visible.map((item) => {
            const kind = item.kind || 'SYSTEM'
            return (
              <article
                key={item.id}
                className={item.read ? 'notification-item' : 'notification-item unread'}
                onClick={() => void open(item)}
              >
                <div className="notification-leading">
                  {!item.read && <span className="unread-dot" />}
                  <span className={`notification-icon ${kind.toLowerCase()}`}>
                    {icons[kind] ?? icons.SYSTEM}
                  </span>
                </div>
                <div className="notification-copy">
                  <div>
                    <h2>{item.title}</h2>
                    <time>{item.timeLabel}</time>
                  </div>
                  <p>{item.content}</p>
                  {item.actionLabel && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        void open(item)
                      }}
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

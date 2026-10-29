import { BellRing, CheckCircle2, Clock3, ListOrdered, MapPin, Trash2, Truck, XCircle } from 'lucide-react'
import { Empty, Popconfirm, Segmented, Skeleton, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { acceptQueue, declineQueue, getMyQueues, leaveQueue, type QueueDto } from '../api/queueApi'
import { VEHICLE_TYPE_LABELS } from '../../vehicles/types/vehicleTypes'

export function DriverQueuesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<QueueDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE')
  const [workingId, setWorkingId] = useState<number | null>(null)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyQueues()
      setItems(data)
    } catch (e) {
      message.error(extractApiError(e as AxiosError))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const init = async () => {
      await load()
    }
    void init()
  }, [load])
  const visible = useMemo(() => items.filter(item => filter === 'ACTIVE' ? ['WAITING', 'NOTIFIED'].includes(item.status) : !['WAITING', 'NOTIFIED'].includes(item.status)), [filter, items])
  const run = async (id: number, action: 'leave' | 'accept' | 'decline') => {
    setWorkingId(id)
    try {
      if (action === 'accept') {
        const booking = await acceptQueue(id)
        message.success(`Đã nhận slot. Booking ${booking.bookingCode.slice(0, 8)}… đã tạo — hãy thanh toán cọc.`)
        navigate('/bookings')
        return
      }
      if (action === 'decline') await declineQueue(id)
      else await leaveQueue(id)
      message.success(action === 'decline' ? 'Đã từ chối slot' : 'Đã rời hàng đợi')
      await load()
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setWorkingId(null)
    }
  }
  return (
    <main className="driver-feature-page stitch-section">
      <header className="driver-page-heading">
        <div>
          <span>HÀNG ĐỢI THÔNG MINH</span>
          <h1>Hàng đợi của tôi</h1>
          <p>Theo dõi vị trí và phản hồi ngay khi bãi dành slot cho bạn.</p>
        </div>
        <Link className="driver-primary-link" to="/parking">Tìm bãi khác</Link>
      </header>
      <div className="queue-toolbar">
        <Segmented value={filter} onChange={value => setFilter(value as 'ACTIVE' | 'HISTORY')} options={[{ label: 'Đang hoạt động', value: 'ACTIVE' }, { label: 'Lịch sử', value: 'HISTORY' }]} />
        <span>Dữ liệu vị trí sẽ tự cập nhật khi BE hỗ trợ realtime.</span>
      </div>
      {loading ? <Skeleton active /> : !visible.length ? (
        <Empty description={filter === 'ACTIVE' ? 'Bạn chưa có lượt chờ đang hoạt động' : 'Chưa có lịch sử hàng đợi'}>
          <Link to="/parking">Tìm bãi đỗ</Link>
        </Empty>
      ) : (
        <section className="queue-grid">
          {visible.map(item => (
            <article className={`queue-card ${item.status === 'NOTIFIED' ? 'slot-ready' : ''}`} key={item.id}>
              <header>
                <span className={`queue-status ${item.status.toLowerCase()}`}>{statusLabel(item.status)}</span>
                {item.status === 'WAITING' && (
                  <Popconfirm title="Rời hàng đợi?" okText="Rời hàng đợi" cancelText="Ở lại" onConfirm={() => void run(item.id, 'leave')}>
                    <button aria-label="Rời hàng đợi"><Trash2 /></button>
                  </Popconfirm>
                )}
              </header>
              <h2>{item.parkingLotName}</h2>
              <p><MapPin /> {item.status === 'NOTIFIED' ? 'Bãi vừa dành một slot phù hợp cho bạn' : 'Đang chờ slot phù hợp được giải phóng'}</p>
              {item.status === 'NOTIFIED' ? (
                <div className="queue-ready">
                  <BellRing />
                  <div>
                    <strong>Đã đến lượt bạn!</strong>
                    <span>Xác nhận trước {item.responseDeadline ? formatDateTime(item.responseDeadline) : 'thời hạn thông báo'}.</span>
                  </div>
                </div>
              ) : (
                <div className="queue-position">
                  <ListOrdered />
                  <div>
                    <small>Vị trí hiện tại</small>
                    <strong>#{item.position}</strong>
                    <span>{item.peopleAhead ?? 0} tài xế phía trước</span>
                  </div>
                </div>
              )}
              <dl>
                <div><dt><Truck /> Phương tiện</dt><dd>{item.vehicleLicensePlate}</dd></div>
                <div><dt>Loại xe</dt><dd>{VEHICLE_TYPE_LABELS[item.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]}</dd></div>
                <div><dt><Clock3 /> Tham gia</dt><dd>{formatDateTime(item.joinedAt)}</dd></div>
              </dl>
              {item.status === 'NOTIFIED' && (
                <div className="queue-actions">
                  <button disabled={workingId === item.id} onClick={() => void run(item.id, 'decline')}><XCircle /> Từ chối</button>
                  <button className="accept" disabled={workingId === item.id} onClick={() => void run(item.id, 'accept')}><CheckCircle2 /> Nhận slot</button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
function statusLabel(status: QueueDto['status']) { return ({ WAITING: 'Đang chờ', NOTIFIED: 'Có slot dành cho bạn', CONVERTED: 'Đã nhận slot', EXPIRED: 'Hết hạn', CANCELLED: 'Đã hủy' })[status] }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }

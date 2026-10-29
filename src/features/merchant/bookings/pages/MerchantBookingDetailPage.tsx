import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Skeleton, Tag } from 'antd'
import type { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import type { BookingDto, BookingStatus } from '../../../bookings/types/bookingTypes'
import { VEHICLE_TYPE_LABELS } from '../../../vehicles/types/vehicleTypes'
import { getMerchantBookings } from '../api/merchantBookingApi'

const statusMeta: Record<BookingStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'gold' },
  PENDING_CHECKIN: { label: 'Chờ check-in', color: 'blue' },
  PARKING: { label: 'Đang đỗ', color: 'processing' },
  OVERTIME: { label: 'Quá giờ', color: 'orange' },
  AWAITING_FINAL_PAYMENT: { label: 'Chờ thanh toán cuối', color: 'purple' },
  COMPLETED: { label: 'Hoàn tất', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
  EXPIRED: { label: 'Hết hạn', color: 'red' },
  REVIEWED: { label: 'Đã đánh giá', color: 'cyan' },
}

export function MerchantBookingDetailPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = async () => {
    const id = Number(bookingId)
    if (!Number.isFinite(id)) {
      setError('Mã booking không hợp lệ')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      // BE chưa có GET /merchant/bookings/{id} — lấy trang và tìm theo id
      let found: BookingDto | undefined
      for (let page = 0; page < 5 && !found; page += 1) {
        const result = await getMerchantBookings(page, 50)
        found = result.content.find((item) => item.id === id)
        if (page >= result.totalPages - 1) break
      }
      if (!found) {
        setError('Không tìm thấy booking thuộc bãi của bạn')
        setBooking(null)
      } else {
        setBooking(found)
      }
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [bookingId])

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant/bookings')} style={{ padding: 0 }}>
            Quay lại danh sách
          </Button>
          <h1>Chi tiết booking</h1>
          <p>Thông tin đơn đặt chỗ và trạng thái vận hành.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </header>

      {error && <Alert type="error" showIcon message="Không tải được chi tiết" description={error} />}
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : booking ? (
        <section className="merchant-detail-card">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Mã booking">{booking.bookingCode}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusMeta[booking.status].color}>{statusMeta[booking.status].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bãi đỗ">{booking.parkingLotName}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{booking.parkingLotAddress}</Descriptions.Item>
            <Descriptions.Item label="Tài xế">{booking.driverName || '—'}</Descriptions.Item>
            <Descriptions.Item label="SĐT tài xế">{booking.driverPhone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Biển số">{booking.vehicleLicensePlate}</Descriptions.Item>
            <Descriptions.Item label="Loại xe">{VEHICLE_TYPE_LABELS[booking.vehicleType]}</Descriptions.Item>
            <Descriptions.Item label="Check-in dự kiến">{formatDateTime(booking.expectedCheckInTime)}</Descriptions.Item>
            <Descriptions.Item label="Check-out dự kiến">{formatDateTime(booking.expectedCheckOutTime)}</Descriptions.Item>
            <Descriptions.Item label="Hết hạn giữ chỗ">{formatDateTime(booking.expiresAt)}</Descriptions.Item>
            <Descriptions.Item label="Check-in thực tế">{formatDateTime(booking.checkInTime)}</Descriptions.Item>
            <Descriptions.Item label="Check-out thực tế">{formatDateTime(booking.checkOutTime)}</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{formatMoney(booking.advanceDeposit)}</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">{formatMoney(booking.totalAmount)}</Descriptions.Item>
          </Descriptions>
          {['PENDING_CHECKIN', 'PARKING', 'OVERTIME'].includes(booking.status) && (
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => navigate('/merchant/qr-scanner')}>
                Mở quét QR
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </main>
  )
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

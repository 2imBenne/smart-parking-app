import { CalendarDays, CircleX, Clock3, Download, ExternalLink, MapPin, ParkingCircle, QrCode, Search, Star, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Empty, Select, Skeleton, message } from 'antd'
import type { AxiosError } from 'axios'
import { env } from '../../../app/env'
import { extractApiError } from '../../../shared/api/errors'
import { getAuthSession } from '../../../shared/auth/session'
import { VEHICLE_TYPE_LABELS } from '../../vehicles/types/vehicleTypes'
import { cancelBooking, confirmDemoDeposit, getMyBookings, payDeposit, payFinal, syncPayOSPayment } from '../api/bookingApi'
import type { BookingDto, BookingStatus } from '../types/bookingTypes'
import { CancelBookingModal, type CancelBookingFormValues } from '../components/CancelBookingModal'
import { ReviewModal } from '../../reviews/components/ReviewModal'
import { QRCodeSVG } from 'qrcode.react'

const statusLabels: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CHECKIN: 'Chờ check-in',
  PARKING: 'Đang đỗ',
  OVERTIME: 'Quá giờ',
  AWAITING_FINAL_PAYMENT: 'Chờ thanh toán cuối',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  REVIEWED: 'Đã đánh giá',
}
const cancellableStatuses: BookingStatus[] = ['PENDING_PAYMENT', 'PENDING_CHECKIN']

function isBookingCancellable(booking: BookingDto) {
  if (booking.canCancel != null) return booking.canCancel
  if (!cancellableStatuses.includes(booking.status)) return false
  if (!booking.cancelDeadlineAt && !booking.createdAt) return true
  const deadline = booking.cancelDeadlineAt
    ? new Date(booking.cancelDeadlineAt).getTime()
    : new Date(booking.createdAt!).getTime() + 60 * 60 * 1000
  return Date.now() <= deadline
}

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [selected, setSelected] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [reviewing, setReviewing] = useState<BookingDto | null>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'ALL' | BookingStatus>('ALL')
  const visibleBookings = useMemo(
    () =>
      bookings.filter(
        (item) =>
          (status === 'ALL' || item.status === status) &&
          `${item.bookingCode} ${item.parkingLotName} ${item.vehicleLicensePlate}`
            .toLocaleLowerCase('vi')
            .includes(keyword.trim().toLocaleLowerCase('vi')),
      ),
    [bookings, keyword, status],
  )

  const loadBookings = useCallback(async (preferSelectedId?: number) => {
    setLoading(true)
    try {
      let data = await getMyBookings()
      const stuck = data.content.filter(
        (item) => item.status === 'PENDING_PAYMENT' || item.status === 'AWAITING_FINAL_PAYMENT',
      )
      if (stuck.length > 0) {
        await Promise.allSettled(stuck.map((item) => syncPayOSPayment({ bookingId: item.id })))
        data = await getMyBookings()
      }
      setBookings(data.content)
      setSelected((current) => {
        const keepId = preferSelectedId ?? current?.id
        if (keepId == null) return data.content[0] ?? null
        return data.content.find((item) => item.id === keepId) ?? data.content[0] ?? null
      })
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  const handleCancelSubmit = async (values: CancelBookingFormValues) => {
    if (!selected) return
    setCancelling(true)
    try {
      const result = await cancelBooking(selected.id, values)
      message.success(result.data?.message || result.message || 'Đã hủy đặt chỗ')
      setCancelOpen(false)
      setSelected(null)
      await loadBookings()
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setCancelling(false)
    }
  }

  const getDirections = () =>
    selected &&
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.parkingLotAddress || selected.parkingLotName || '')}`,
      '_blank',
      'noopener,noreferrer',
    )

  const handlePayment = async () => {
    if (!selected) return
    setPaying(true)
    try {
      const paymentUrl =
        selected.status === 'AWAITING_FINAL_PAYMENT' ? await payFinal(selected.id) : await payDeposit(selected.id)
      if (paymentUrl) {
        sessionStorage.setItem('payos.pendingBookingId', String(selected.id))
        window.location.href = paymentUrl
        return
      }
      message.error('Không nhận được link thanh toán từ server')
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setPaying(false)
    }
  }

  const handleDemoPayment = async () => {
    if (!selected || selected.status !== 'PENDING_PAYMENT' || !env.enableDemoPayment) return
    setPaying(true)
    try {
      const updated = await confirmDemoDeposit(selected.id)
      message.success('Thanh toán demo thành công. QR check-in đã sẵn sàng.')
      await loadBookings(updated.bookingId ?? selected.id)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setPaying(false)
    }
  }

  const handleSyncPayOS = async () => {
    if (!selected) return
    if (selected.status !== 'PENDING_PAYMENT' && selected.status !== 'AWAITING_FINAL_PAYMENT') return
    setPaying(true)
    try {
      const updated = await syncPayOSPayment({ bookingId: selected.id })
      const statusText = statusLabels[updated.status as BookingStatus] ?? updated.status
      message.success(`Đã đồng bộ PayOS. Trạng thái: ${statusText}`)
      await loadBookings(updated.bookingId ?? selected.id)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setPaying(false)
    }
  }

  const downloadInvoice = () => {
    if (!selected) return
    const text = `SMARTTRUCK PARKING\nBooking: ${selected.bookingCode}\nBãi: ${selected.parkingLotName}\nXe: ${selected.vehicleLicensePlate}\nBắt đầu: ${formatDateTime(selected.expectedCheckInTime)}\nKết thúc dự kiến: ${formatDateTime(selected.expectedCheckOutTime)}\nTổng tiền: ${formatMoney(selected.totalAmount)}\nTiền cọc: ${formatMoney(selected.advanceDeposit)}\nTrạng thái: ${statusLabels[selected.status]}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `booking-${selected.bookingCode}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="my-bookings-page stitch-section">
      <div className="bookings-heading">
        <h1>Đặt chỗ của tôi</h1>
        <p>Quản lý lịch đặt chỗ và lịch sử đỗ xe.</p>
      </div>
      <div className="booking-list-filters">
        <label>
          <Search />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm mã booking, bãi hoặc biển số"
          />
        </label>
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
        <span>{visibleBookings.length} booking</span>
      </div>
      <div className={selected ? 'bookings-workspace detail-open' : 'bookings-workspace'}>
        <section className="booking-table">
          <div className="booking-table-header">
            <span>BÃI ĐỖ</span>
            <span>THỜI GIAN</span>
            <span>LOẠI XE</span>
            <span>TRẠNG THÁI</span>
          </div>
          {loading ? (
            [1, 2, 3].map((item) => (
              <div className="booking-row" key={item}>
                <Skeleton active paragraph={{ rows: 1 }} />
              </div>
            ))
          ) : visibleBookings.length === 0 ? (
            <Empty description="Không có booking phù hợp" />
          ) : (
            visibleBookings.map((booking) => (
              <button
                key={booking.id}
                className={selected?.id === booking.id ? 'booking-row active' : 'booking-row'}
                onClick={() => setSelected(booking)}
              >
                <span className="booking-lot">
                  <i>
                    <ParkingCircle />
                  </i>
                  <span>
                    <strong>{booking.parkingLotName}</strong>
                    <small title={booking.bookingCode}>{shortCode(booking.bookingCode)}</small>
                  </span>
                </span>
                <span>
                  <strong>{formatDate(booking.expectedCheckInTime)}</strong>
                  <small>{formatTime(booking.expectedCheckInTime)}</small>
                </span>
                <span>
                  <strong>{VEHICLE_TYPE_LABELS[booking.vehicleType]}</strong>
                  <small>{booking.vehicleLicensePlate}</small>
                </span>
                <em className={`booking-status ${booking.status.toLowerCase()}`}>{statusLabels[booking.status]}</em>
              </button>
            ))
          )}
        </section>
        {selected && (
          <aside className="booking-detail-panel">
            <header>
              <div>
                <h2>Chi tiết đặt chỗ</h2>
                <p title={selected.bookingCode}>Mã: {shortCode(selected.bookingCode)}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Đóng chi tiết">
                <X />
              </button>
            </header>
            <div className="booking-detail-scroll">
              <section className="qr-card">
                <span className={`booking-status ${selected.status.toLowerCase()}`}>{statusLabels[selected.status]}</span>
                {['PENDING_CHECKIN', 'PARKING', 'OVERTIME'].includes(selected.status) ? (
                  <>
                    <div className="booking-real-qr" role="img" aria-label={`QR booking ${selected.bookingCode}`}>
                      <QRCodeSVG value={selected.bookingCode} size={180} level="M" marginSize={2} />
                    </div>
                    <small title={selected.bookingCode}>{shortCode(selected.bookingCode)}</small>
                  </>
                ) : (
                  <div className="qr-placeholder">
                    <QrCode />
                    <span style={{ fontSize: '13px', textAlign: 'center', padding: '0 8px' }}>
                      {selected.status === 'PENDING_PAYMENT'
                        ? 'Chờ thanh toán cọc để kích hoạt QR'
                        : 'QR chưa khả dụng'}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                  {selected.status === 'PENDING_PAYMENT'
                    ? 'Vui lòng thanh toán tiền cọc ở nút bên dưới để mở mã QR check-in vào bãi.'
                    : 'Xuất trình mã booking tại cổng để check-in/check-out.'}
                </p>
                {selected.status === 'PENDING_CHECKIN' && (
                  <p className="qr-early-hint">Check-in sớm tối đa 30 phút trước giờ bắt đầu đã đặt.</p>
                )}
              </section>
              <DetailCard title="Thông tin địa điểm">
                <div className="detail-grid">
                  <Info label="Bãi đỗ" value={selected.parkingLotName || `Bãi #${selected.parkingLotId}`} icon={<ParkingCircle />} wide />
                  <Info label="Địa chỉ" value={selected.parkingLotAddress || 'Đang cập nhật'} icon={<MapPin />} wide />
                </div>
              </DetailCard>
              <DetailCard title="Lịch trình & phương tiện">
                <div className="detail-grid">
                  <Info label="Bắt đầu" value={formatDateTime(selected.expectedCheckInTime)} icon={<CalendarDays />} />
                  <Info label="Kết thúc dự kiến" value={formatDateTime(selected.expectedCheckOutTime)} icon={<Clock3 />} />
                  <Info label="Loại xe" value={VEHICLE_TYPE_LABELS[selected.vehicleType]} icon={<Truck />} />
                  <Info label="Biển số" value={selected.vehicleLicensePlate || selected.vehiclePlate || 'Đang cập nhật'} icon={<Truck />} />
                </div>
              </DetailCard>
              <DetailCard title="Chi phí">
                <div className="booking-cost">
                  <p>
                    <span>Tổng tiền dự kiến</span>
                    <strong>{formatMoney(selected.totalAmount)}</strong>
                  </p>
                  <p>
                    <span>Tiền cọc</span>
                    <strong>{formatMoney(selected.advanceDeposit)}</strong>
                  </p>
                  <p>
                    <span>Còn lại tại bãi</span>
                    <strong>{formatMoney(Math.max(0, selected.totalAmount - selected.advanceDeposit))}</strong>
                  </p>
                </div>
              </DetailCard>
            </div>
            <footer>
              {(selected.status === 'PENDING_PAYMENT' || selected.status === 'AWAITING_FINAL_PAYMENT') && (
                <div className="booking-footer-primary">
                  <button className="pay-booking" disabled={paying} onClick={() => void handlePayment()}>
                    {paying
                      ? 'Đang xử lý...'
                      : selected.status === 'AWAITING_FINAL_PAYMENT'
                        ? 'Thanh toán phần còn lại'
                        : 'Thanh toán cọc (PayOS)'}
                  </button>
                  <button className="confirm-demo-payment" disabled={paying} onClick={() => void handleSyncPayOS()}>
                    {paying ? 'Đang xử lý...' : 'Đồng bộ PayOS'}
                  </button>
                  {env.enableDemoPayment && selected.status === 'PENDING_PAYMENT' && (
                    <button
                      className="confirm-demo-payment"
                      disabled={paying}
                      onClick={() => void handleDemoPayment()}
                    >
                      {paying ? 'Đang xử lý...' : 'Thanh toán demo'}
                    </button>
                  )}
                </div>
              )}
              {(isBookingCancellable(selected) || selected.status === 'COMPLETED') && (
                <div className="booking-footer-secondary">
                  {isBookingCancellable(selected) && (
                    <button className="cancel-booking" disabled={cancelling || paying} onClick={() => setCancelOpen(true)}>
                      <CircleX /> Hủy chỗ / hoàn tiền
                    </button>
                  )}
                  {selected.status === 'COMPLETED' && (
                    <button className="review-booking" onClick={() => setReviewing(selected)}>
                      <Star /> Đánh giá bãi
                    </button>
                  )}
                </div>
              )}
              {cancellableStatuses.includes(selected.status) && !isBookingCancellable(selected) && (
                <p className="cancel-window-hint">
                  Đã hết hạn hủy chỗ/hoàn tiền (1 giờ sau khi đặt). Liên hệ Admin/Merchant nếu cần hỗ trợ.
                </p>
              )}
              <div className="booking-footer-meta">
                <button type="button" onClick={downloadInvoice}>
                  <Download /> Hóa đơn
                </button>
                <button type="button" className="directions-button" onClick={getDirections}>
                  <ExternalLink /> Chỉ đường
                </button>
              </div>
            </footer>
          </aside>
        )}
      </div>
      <CancelBookingModal
        open={cancelOpen && Boolean(selected)}
        loading={cancelling}
        bookingCode={selected?.bookingCode}
        paidDeposit={selected?.status === 'PENDING_CHECKIN'}
        defaultPhone={getAuthSession()?.phone}
        onCancel={() => setCancelOpen(false)}
        onSubmit={handleCancelSubmit}
      />
      {reviewing && (
        <ReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onSuccess={() => {
            setReviewing(null)
            setSelected(null)
            void loadBookings()
          }}
        />
      )}
    </main>
  )
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="booking-info-card">
      <h3>{title}</h3>
      {children}
    </section>
  )
}
function Info({ label, value, icon, wide }: { label: string; value: string; icon: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'detail-info wide' : 'detail-info'}>
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  )
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
function formatMoney(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}
function shortCode(value: string) {
  if (value.length <= 13) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

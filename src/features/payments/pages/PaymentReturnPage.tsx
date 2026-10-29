import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Result, Spin } from 'antd'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { getAuthSession } from '../../../shared/auth/session'
import { confirmDemoDeposit, syncPayOSPayment } from '../../bookings/api/bookingApi'

type SyncState = 'idle' | 'syncing' | 'success' | 'pending' | 'error' | 'cancelled'

const PENDING_BOOKING_KEY = 'payos.pendingBookingId'

/**
 * PayOS redirect về đây sau thanh toán.
 * Webhook thường không tới localhost → trang này gọi API sync trạng thái từ PayOS.
 */
export function PaymentReturnPage({ mode }: { mode: 'success' | 'cancel' }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState<SyncState>(mode === 'cancel' ? 'cancelled' : 'idle')
  const [message, setMessage] = useState('')

  const getBookingIdValue = () => {
    const raw = params.get('bookingId') || sessionStorage.getItem(PENDING_BOOKING_KEY)
    const val = raw ? Number(raw) : undefined
    return Number.isFinite(val) ? val : undefined
  }

  const handleConfirmDemo = async (customBookingId?: number) => {
    const bId = customBookingId ?? getBookingIdValue()
    if (!bId) {
      setMessage('Không tìm thấy booking ID để xác nhận thanh toán demo.')
      return
    }
    setState('syncing')
    try {
      await confirmDemoDeposit(bId)
      setState('success')
      setMessage('Thanh toán demo thành công. Booking đã chuyển sang PENDING_CHECKIN (Sẵn sàng check-in).')
      sessionStorage.removeItem(PENDING_BOOKING_KEY)
    } catch (err) {
      setMessage(extractApiError(err as AxiosError))
      setState('error')
    }
  }

  const runSync = async () => {
    const orderCodeRaw = params.get('orderCode')
    const paymentLinkId = params.get('id') || undefined
    const bookingIdValue = getBookingIdValue()
    const orderCode = orderCodeRaw ? Number(orderCodeRaw) : undefined
    const isSimulated = params.get('simulated') === 'true'

    // Nếu PayOS lỗi link và rơi vào fallback simulated checkout trong môi trường dev
    if (isSimulated && bookingIdValue) {
      await handleConfirmDemo(bookingIdValue)
      return
    }

    const payload = {
      orderCode: Number.isFinite(orderCode) ? orderCode : undefined,
      paymentLinkId: paymentLinkId || undefined,
      bookingId: bookingIdValue,
    }

    if (!payload.orderCode && !payload.paymentLinkId && !payload.bookingId) {
      setState('error')
      setMessage('Thiếu thông tin PayOS. Mở Đặt chỗ của tôi và bấm Đồng bộ PayOS.')
      return
    }

    setState('syncing')
    try {
      // Ưu tiên sync đủ tham số; nếu orderCode không khớp DB thì fallback bookingId.
      let booking = await syncPayOSPayment(payload).catch(async (error) => {
        if (payload.bookingId && (payload.orderCode || payload.paymentLinkId)) {
          return syncPayOSPayment({ bookingId: payload.bookingId, orderCode: payload.orderCode, paymentLinkId: payload.paymentLinkId })
            .catch(() => syncPayOSPayment({ bookingId: payload.bookingId }))
        }
        throw error
      })

      if (booking.status === 'SUCCESS') {
        setState('success')
        setMessage('Đã ghi nhận thanh toán thành công. Booking đã sẵn sàng check-in.')
        sessionStorage.removeItem(PENDING_BOOKING_KEY)
      } else {
        setState('pending')
        setMessage(
          `Cổng PayOS chưa hoàn tất thanh toán (trạng thái: ${booking.status}). Nếu bạn đang thử nghiệm hoặc cổng PayOS tạm dừng, hãy bấm "Xác nhận thanh toán demo" bên dưới.`,
        )
      }
    } catch (error) {
      const text = extractApiError(error as AxiosError)
      if (/chờ thanh toán|PENDING|PROCESSING/i.test(text)) {
        setState('pending')
      } else if (/Not found/i.test(text)) {
        setState('error')
        setMessage(
          'Không tìm thấy giao dịch thanh toán trên hệ thống. Hãy thử bấm "Xác nhận thanh toán demo" hoặc vào Đặt chỗ → Đồng bộ PayOS.',
        )
      } else {
        setState('error')
        setMessage(text)
      }
    }
  }

  useEffect(() => {
    if (mode === 'cancel') {
      setMessage('Bạn đã hủy thanh toán trên PayOS.')
      return
    }

    const session = getAuthSession()
    if (!session?.token || session.role !== 'DRIVER') {
      navigate('/login', {
        replace: true,
        state: { from: `${window.location.pathname}${window.location.search}` },
      })
      return
    }

    const status = (params.get('status') || params.get('code') || '').toUpperCase()
    const cancelled = params.get('cancel') === 'true'
    if (cancelled || status === 'CANCELLED') {
      setState('cancelled')
      setMessage('Thanh toán đã bị hủy.')
      return
    }

    void runSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, navigate, params])

  if (state === 'syncing' || state === 'idle') {
    return (
      <main className="stitch-section" style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang đồng bộ thanh toán PayOS với hệ thống…</p>
      </main>
    )
  }

  if (state === 'success') {
    return (
      <main className="stitch-section" style={{ maxWidth: 640, margin: '48px auto' }}>
        <Result
          status="success"
          title="Thanh toán thành công"
          subTitle={message}
          extra={[
            <Button type="primary" key="bookings" onClick={() => navigate('/bookings')}>
              Về đặt chỗ của tôi
            </Button>,
          ]}
        />
      </main>
    )
  }

  if (state === 'cancelled') {
    return (
      <main className="stitch-section" style={{ maxWidth: 640, margin: '48px auto' }}>
        <Result
          status="info"
          title="Đã hủy thanh toán"
          subTitle={message}
          extra={[
            <Button type="primary" key="bookings" onClick={() => navigate('/bookings')}>
              Về đặt chỗ của tôi
            </Button>,
          ]}
        />
      </main>
    )
  }

  const bId = getBookingIdValue()

  return (
    <main className="stitch-section" style={{ maxWidth: 640, margin: '48px auto' }}>
      <Result
        status={state === 'pending' ? 'warning' : 'error'}
        title={state === 'pending' ? 'Chưa ghi nhận xong' : 'Không đồng bộ được'}
        subTitle={message}
        extra={[
          bId ? (
            <Button type="primary" key="demo" onClick={() => void handleConfirmDemo(bId)}>
              Xác nhận thanh toán demo (Kích hoạt QR ngay)
            </Button>
          ) : null,
          <Button key="retry" onClick={() => void runSync()}>
            Thử đồng bộ lại
          </Button>,
          <Button key="bookings" onClick={() => navigate('/bookings')}>
            Về đặt chỗ
          </Button>,
        ].filter(Boolean)}
      />
      <Alert
        style={{ marginTop: 16 }}
        type="info"
        showIcon
        message="Mẹo môi trường dev / local"
        description={
          <>
            Nếu bạn đang chạy local hoặc kênh PayOS đang tạm dừng, hãy bấm{' '}
            <strong>Xác nhận thanh toán demo</strong> để kích hoạt trạng thái cọc và mã QR check-in ngay mà không cần qua cổng ngân hàng.
          </>
        }
      />
    </main>
  )
}

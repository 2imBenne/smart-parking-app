import { ArrowRight, Clock3, Timer, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { env } from '../../../app/env'
import { extractApiError } from '../../../shared/api/errors'
import { getAuthSession } from '../../../shared/auth/session'
import { cancelBooking, confirmDemoDeposit, createBooking, payDeposit } from '../../bookings/api/bookingApi'
import type { BookingDto } from '../../bookings/types/bookingTypes'
import type { ParkingLotDto } from '../types/parkingTypes'
import type { VehicleDto } from '../../vehicles/types/vehicleTypes'
import { VEHICLE_TYPE_LABELS } from '../../vehicles/types/vehicleTypes'

type Props = {
  lot: ParkingLotDto
  vehicles: VehicleDto[]
  preferredVehicleId?: number
  onClose: () => void
}

export function InlineQuickBookPanel({ lot, vehicles, preferredVehicleId, onClose }: Props) {
  const navigate = useNavigate()
  const compatibleVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) =>
        lot.slots.some((slot) => slot.vehicleType === vehicle.vehicleType && slot.totalCapacity > 0),
      ),
    [lot.slots, vehicles],
  )
  const initialVehicleId =
    preferredVehicleId && compatibleVehicles.some((item) => item.id === preferredVehicleId)
      ? preferredVehicleId
      : compatibleVehicles[0]?.id ?? null

  const [step, setStep] = useState<1 | 2>(1)
  const [vehicleId, setVehicleId] = useState<number | null>(initialVehicleId)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const paymentRequestRef = useRef(false)
  const demoPaymentRequestRef = useRef(false)

  const vehicle = compatibleVehicles.find((item) => item.id === vehicleId)
  const priceRule = lot.pricingRules.find((rule) => rule.vehicleType === vehicle?.vehicleType)
  const hours =
    startTime && endTime
      ? Math.max(0, Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 3_600_000))
      : 0
  const total = hours * (priceRule?.basePricePerHour ?? 0)
  const deposit = Math.round(total * 0.2)

  const addHours = (value: number) => {
    const base = startTime ? new Date(startTime) : new Date()
    if (!startTime) setStartTime(toLocalInput(base))
    setEndTime(toLocalInput(new Date(base.getTime() + value * 3_600_000)))
  }

  const closeAndCleanup = async () => {
    if (booking && step === 2) {
      try {
        const raw = booking.driverPhone || getAuthSession()?.phone || '0900000000'
        const digits = raw.replace(/\D/g, '')
        const contactPhone = digits.startsWith('0') ? digits.slice(0, 11) : `0${digits}`.slice(0, 11)
        await cancelBooking(booking.id, {
          reason: 'Hủy trong lúc thanh toán',
          contactPhone: /^0\d{9,10}$/.test(contactPhone) ? contactPhone : '0900000000',
          preferredResolution: 'Chỉ hủy slot, không yêu cầu hoàn tiền',
          note: 'Hủy từ form đặt nhanh trên danh sách tìm bãi',
        })
      } catch {
        // ignore cancel failure on close
      }
    }
    onClose()
  }

  const holdSlot = async () => {
    if (!vehicle || !startTime || !endTime || hours <= 0) {
      message.warning('Vui lòng chọn xe và khoảng thời gian hợp lệ')
      return
    }
    setSubmitting(true)
    try {
      const created = await createBooking({
        parkingLotId: lot.id,
        parkingLotName: lot.name,
        parkingLotAddress: lot.address,
        merchantId: lot.merchantId,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        expectedCheckInTime: toBackendLocalDateTime(startTime),
        expectedCheckOutTime: toBackendLocalDateTime(endTime),
        totalAmount: total,
        advanceDeposit: deposit,
      })
      setBooking(created)
      setStep(2)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  const payWithPayOS = async () => {
    if (!booking || paymentRequestRef.current) return
    paymentRequestRef.current = true
    setSubmitting(true)
    try {
      const depositAmount = booking.advanceDeposit ?? deposit
      const checkoutUrl = await payDeposit(booking.id, depositAmount, booking.merchantId ?? lot.merchantId, booking.parkingLotId ?? lot.id)
      if (!checkoutUrl) throw new Error('Backend không trả về đường dẫn thanh toán.')
      sessionStorage.setItem('payos.pendingBookingId', String(booking.id))
      window.location.assign(checkoutUrl)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      paymentRequestRef.current = false
      setSubmitting(false)
    }
  }

  const payDemo = async () => {
    if (!booking || !env.enableDemoPayment || demoPaymentRequestRef.current) return
    demoPaymentRequestRef.current = true
    setSubmitting(true)
    try {
      const depositAmount = booking.advanceDeposit ?? deposit
      await confirmDemoDeposit(booking.id, depositAmount, booking.merchantId ?? lot.merchantId, booking.parkingLotId ?? lot.id)
      message.success('Thanh toán demo thành công. QR check-in đã sẵn sàng.')
      onClose()
      navigate('/bookings')
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      demoPaymentRequestRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div
      className="parking-inline-book"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header>
        <div>
          <strong>Đặt chỗ nhanh</strong>
          <span>
            {lot.name} · bước {step}/2
          </span>
        </div>
        <button type="button" onClick={() => void closeAndCleanup()} aria-label="Đóng form đặt chỗ">
          <X />
        </button>
      </header>

      {step === 1 ? (
        <>
          {!vehicles.length ? (
            <div className="parking-inline-empty" style={{ padding: '8px 0' }}>
              <p style={{ margin: '0 0 10px', color: '#475467', fontSize: 13, lineHeight: 1.5 }}>
                Bạn chưa đăng ký phương tiện trong tài khoản. Hãy thêm thông tin xe để bãi đỗ nhận diện biển số khi check-in.
              </p>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#0f3d5c',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/dashboard/vehicles')}
              >
                + Thêm phương tiện ngay
              </button>
            </div>
          ) : !compatibleVehicles.length ? (
            <div className="parking-inline-empty" style={{ padding: '8px 0' }}>
              <p style={{ margin: '0 0 10px', color: '#475467', fontSize: 13, lineHeight: 1.5 }}>
                Bãi này chưa cấu hình chỗ đỗ phù hợp cho các phương tiện hiện tại của bạn.
              </p>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#0f3d5c',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/dashboard/vehicles')}
              >
                + Thêm loại xe khác
              </button>
            </div>
          ) : (
            <>
              <label>
                Phương tiện
                <select value={vehicleId ?? ''} onChange={(event) => setVehicleId(Number(event.target.value))}>
                  {compatibleVehicles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.licensePlate}
                      {item.brandModel ? ` · ${item.brandModel}` : ''} · {VEHICLE_TYPE_LABELS[item.vehicleType]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="parking-inline-times">
                <p className="parking-inline-hint">Cách khung giờ khác tối thiểu 30 phút.</p>
                <label>
                  Bắt đầu
                  <input
                    type="datetime-local"
                    min={toLocalInput(new Date())}
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </label>
                <label>
                  Kết thúc dự kiến
                  <input
                    type="datetime-local"
                    min={startTime || toLocalInput(new Date())}
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </label>
              </div>
              <div className="parking-inline-quick">
                <button type="button" onClick={() => addHours(2)}>
                  + 2 giờ
                </button>
                <button type="button" onClick={() => addHours(4)}>
                  + 4 giờ
                </button>
                <button type="button" onClick={() => addHours(10)}>
                  + Qua đêm
                </button>
              </div>
              <div className="parking-inline-summary">
                <span>
                  {hours ? `${hours} giờ` : 'Chưa chọn thời lượng'} · Cọc {formatMoney(deposit)}
                </span>
                <strong>{formatMoney(total)}</strong>
              </div>
              {priceRule?.surgeStartTime && priceRule?.surgeEndTime && Number(priceRule.surgeMultiplier) > 1 && (
                <p className="parking-inline-peak">
                  <Clock3 /> Cao điểm {String(priceRule.surgeStartTime).slice(0, 5)}–
                  {String(priceRule.surgeEndTime).slice(0, 5)} (×{Number(priceRule.surgeMultiplier).toFixed(2)})
                </p>
              )}
              <button type="button" className="parking-inline-submit" disabled={submitting} onClick={() => void holdSlot()}>
                {submitting ? 'Đang giữ chỗ...' : <>Giữ chỗ & thanh toán <ArrowRight /></>}
              </button>
            </>
          )}
        </>
      ) : (
        <div className="parking-inline-pay">
          <p>Số tiền cọc</p>
          <strong>{formatMoney(booking?.advanceDeposit ?? deposit)}</strong>
          <small>Mã: {booking?.bookingCode}</small>
          <div className="parking-inline-hold">
            <Timer /> Slot giữ 30 phút
          </div>
          <div className="parking-inline-pay-actions">
            <button type="button" disabled={submitting} onClick={() => void payWithPayOS()}>
              {submitting ? 'Đang xử lý...' : 'Thanh toán PayOS'}
            </button>
            {env.enableDemoPayment && (
              <button type="button" className="demo" disabled={submitting} onClick={() => void payDemo()}>
                Thanh toán demo
              </button>
            )}
            <button
              type="button"
              className="ghost"
              onClick={() => {
                onClose()
                navigate('/bookings')
              }}
            >
              Thanh toán sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}
function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}
function toBackendLocalDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value.slice(0, 19)
}

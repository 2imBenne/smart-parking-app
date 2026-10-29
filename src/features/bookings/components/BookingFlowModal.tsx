import { ArrowRight, CheckCircle2, Clock3, Plus, Timer, Truck, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { env } from '../../../app/env'
import { getAuthSession } from '../../../shared/auth/session'
import type { ParkingLotDto } from '../../parking-search/types/parkingTypes'
import type { VehicleDto } from '../../vehicles/types/vehicleTypes'
import { VEHICLE_TYPE_LABELS } from '../../vehicles/types/vehicleTypes'
import { cancelBooking, confirmDemoDeposit, createBooking, payDeposit } from '../api/bookingApi'
import type { BookingDto } from '../types/bookingTypes'

type Props = { open: boolean; lot: ParkingLotDto; vehicles: VehicleDto[]; onClose: () => void }

export function BookingFlowModal({ open, lot, vehicles, onClose }: Props) {
  const navigate = useNavigate()
  const compatibleVehicles = useMemo(
    () => vehicles.filter((vehicle) => lot.slots.some((slot) => slot.vehicleType === vehicle.vehicleType && slot.totalCapacity > 0)),
    [lot.slots, vehicles],
  )
  const [step, setStep] = useState<1 | 2>(1)
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const paymentRequestRef = useRef(false)
  const demoPaymentRequestRef = useRef(false)
  const vehicle = compatibleVehicles.find((item) => item.id === vehicleId)
  const priceRule = lot.pricingRules.find((rule) => rule.vehicleType === vehicle?.vehicleType)
  const hours = startTime && endTime ? Math.max(0, Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 3_600_000)) : 0
  const total = hours * (priceRule?.basePricePerHour ?? 0)
  const deposit = Math.round(total * 0.2)

  const resetAndClose = () => {
    setStep(1)
    setVehicleId(null)
    setStartTime('')
    setEndTime('')
    setBooking(null)
    onClose()
  }
  const addHours = (value: number) => {
    const base = startTime ? new Date(startTime) : new Date()
    setEndTime(toLocalInput(new Date(base.getTime() + value * 3_600_000)))
  }
  const continueToPayment = async () => {
    if (!vehicle || !startTime || !endTime || hours <= 0) return void message.warning('Vui lòng chọn xe và khoảng thời gian hợp lệ')
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
      })
      setBooking(created)
      setStep(2)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }
  const confirmPayment = async () => {
    if (!booking || paymentRequestRef.current) return
    paymentRequestRef.current = true
    setSubmitting(true)
    try {
      const checkoutUrl = await payDeposit(booking.id)
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
  const cancelCurrentBooking = async () => {
    if (booking) {
      const phone = booking.driverPhone || getAuthSession()?.phone || '0900000000'
      await cancelBooking(booking.id, {
        reason: 'Hủy trong lúc thanh toán',
        contactPhone: phone.replace(/\D/g, '').startsWith('0') ? phone.replace(/\D/g, '') : `0${phone.replace(/\D/g, '')}`.slice(0, 11),
        preferredResolution: 'Chỉ hủy slot, không yêu cầu hoàn tiền',
        note: 'Hủy từ modal thanh toán trước khi hoàn tất cọc',
      })
    }
    resetAndClose()
  }
  const confirmDemoPayment = async () => {
    if (!booking || !env.enableDemoPayment || demoPaymentRequestRef.current) return
    demoPaymentRequestRef.current = true
    setSubmitting(true)
    try {
      await confirmDemoDeposit(booking.id)
      message.success('Thanh toán demo thành công. QR check-in đã sẵn sàng.')
      resetAndClose()
      navigate('/bookings')
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      demoPaymentRequestRef.current = false
      setSubmitting(false)
    }
  }
  if (!open) return null

  return (
    <div className="booking-flow-overlay" role="dialog" aria-modal="true" aria-label="Đặt chỗ">
      <div className={step === 1 ? 'booking-flow-modal booking-step-one' : 'booking-flow-modal booking-step-two'}>
        <header>
          <div>
            <h2>Đặt chỗ – Bước {step}: {step === 1 ? 'Chọn thông tin' : 'Thanh toán cọc'}</h2>
            <p>{step === 1 ? 'Chọn xe và thời gian dự kiến.' : 'Thanh toán cọc an toàn qua PayOS để xác nhận giữ chỗ.'}</p>
          </div>
          <button onClick={resetAndClose} aria-label="Đóng"><X /></button>
          <div className="booking-progress">
            <span className={step === 1 ? 'active' : 'done'}>{step === 1 ? '1' : <CheckCircle2 />}</span>
            <small>Thông tin</small>
            <i />
            <span className={step === 2 ? 'active' : ''}>2</span>
            <small>Thanh toán</small>
          </div>
        </header>
        {step === 1 ? (
          <div className="booking-step-content">
            <section className="booking-form-area">
              <h3><Truck /> Chọn phương tiện</h3>
              <div className="vehicle-choice-grid">
                {compatibleVehicles.map((item) => (
                  <button key={item.id} className={vehicleId === item.id ? 'selected' : ''} onClick={() => setVehicleId(item.id)}>
                    <strong>{item.licensePlate}</strong>
                    <span>{VEHICLE_TYPE_LABELS[item.vehicleType]} • {item.weightTon} tấn</span>
                    {vehicleId === item.id && <CheckCircle2 />}
                  </button>
                ))}
                <button className="add-vehicle-choice" onClick={() => navigate('/vehicles')}><Plus /> Thêm phương tiện</button>
              </div>
              {!compatibleVehicles.length && <p>Bãi chưa cấu hình sức chứa cho các xe của bạn.</p>}
              <div className="booking-time-section">
                <h3><Clock3 /> Thời gian đỗ xe</h3>
                <p className="booking-time-hint">Đặt theo khung giờ — cách booking khác tối thiểu 30 phút (ra/vào). Chỗ vật lý chỉ đổi khi check-in/out.</p>
                <div className="booking-time-grid">
                  <label>Thời gian bắt đầu<input type="datetime-local" min={toLocalInput(new Date())} value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
                  <label>Thời gian kết thúc dự kiến<input type="datetime-local" min={startTime} value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
                </div>
                <div className="quick-time-buttons">
                  <button onClick={() => addHours(2)}>+ 2 giờ</button>
                  <button onClick={() => addHours(4)}>+ 4 giờ</button>
                  <button onClick={() => addHours(10)}>+ Qua đêm</button>
                </div>
              </div>
            </section>
            <aside className="booking-summary">
              <h3>Tóm tắt đặt chỗ</h3>
              <dl>
                <div><dt>Bãi đỗ</dt><dd>{lot.name}</dd></div>
                <div><dt>Phương tiện</dt><dd>{vehicle?.licensePlate ?? 'Chưa chọn'}</dd></div>
                <div><dt>Thời lượng</dt><dd>{hours ? `${hours} giờ` : 'Chưa chọn'}</dd></div>
              </dl>
              <div className="summary-money">
                <p><span>Phí dự kiến</span><strong>{formatMoney(total)}</strong></p>
                <p><span>Tiền cọc (20%)</span><strong>{formatMoney(deposit)}</strong></p>
                <div><span>Thanh toán tại bãi</span><strong>{formatMoney(total - deposit)}</strong></div>
              </div>
              {priceRule?.surgeStartTime && priceRule?.surgeEndTime && Number(priceRule.surgeMultiplier) > 1 && (
                <p className="booking-peak-note">
                  <Clock3 /> Cao điểm {String(priceRule.surgeStartTime).slice(0, 5)}–{String(priceRule.surgeEndTime).slice(0, 5)} (×{Number(priceRule.surgeMultiplier).toFixed(2)}). Phí cuối có thể cao hơn nếu khung giờ trùng.
                </p>
              )}
              <button className="continue-payment" disabled={submitting || !compatibleVehicles.length} onClick={() => void continueToPayment()}>
                {submitting ? 'Đang giữ chỗ...' : <>Tiếp tục <ArrowRight /></>}
              </button>
              <button className="cancel-flow" onClick={resetAndClose}>Hủy bỏ</button>
            </aside>
          </div>
        ) : (
          <div className="payment-step-content">
            <span className="waiting-payment">PAYOS SECURE PAYMENT</span>
            <div className="demo-payment-mark"><CheckCircle2 /></div>
            <p>Số tiền cọc</p>
            <strong>{formatMoney(booking?.advanceDeposit ?? 0)}</strong>
            <small>Mã đơn: {booking?.bookingCode}</small>
            <div className="payment-countdown"><Timer /> Slot được giữ trong 30 phút</div>
            <p className="payment-note">Bạn sẽ được chuyển đến PayOS để hoàn tất thanh toán. Booking được xác nhận sau khi hệ thống nhận webhook thành công.</p>
          </div>
        )}
        {step === 2 && (
          <footer>
            <button onClick={() => void cancelCurrentBooking()}>Hủy booking</button>
            <button className="open-payos" disabled={submitting} onClick={() => void confirmPayment()}>
              {submitting ? 'Đang xử lý...' : 'Thanh toán qua PayOS'}
            </button>
            {env.enableDemoPayment && (
              <button className="confirm-demo-payment" disabled={submitting} onClick={() => void confirmDemoPayment()}>
                Hoàn tất thanh toán demo
              </button>
            )}
            <button onClick={() => { resetAndClose(); navigate('/bookings') }}>Thanh toán sau</button>
          </footer>
        )}
      </div>
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

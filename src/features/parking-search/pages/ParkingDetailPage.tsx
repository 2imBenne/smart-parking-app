import { ArrowLeft, Camera, Clock3, MapPin, ShieldCheck, Star, Truck, UserRound } from 'lucide-react'
import { Empty, Progress, Select, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getParkingLotDetail } from '../api/parkingApi'
import { getMyVehicles } from '../../vehicles/api/vehicleApi'
import { getLotReviews } from '../../reviews/api/reviewApi'
import { joinQueue } from '../../queues/api/queueApi'
import { VEHICLE_TYPE_LABELS, type VehicleDto } from '../../vehicles/types/vehicleTypes'
import type { ParkingLotDto, PricingRuleDto } from '../types/parkingTypes'
import { BookingFlowModal } from '../../bookings/components/BookingFlowModal'

export function ParkingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lot, setLot] = useState<ParkingLotDto | null>(null)
  const [vehicles, setVehicles] = useState<VehicleDto[]>([])
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([])
  const [vehicleId, setVehicleId] = useState<number>()
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    const load = async () => {
      const [detailResult, vehicleResult, reviewResult] = await Promise.allSettled([
        getParkingLotDetail(Number(id)),
        getMyVehicles(0, 50),
        getLotReviews(Number(id), 0, 10),
      ])
      if (!active) return
      if (detailResult.status === 'fulfilled') setLot(detailResult.value)
      else message.error('Không thể tải thông tin bãi đỗ.')
      if (vehicleResult.status === 'fulfilled') {
        setVehicles(vehicleResult.value.content)
        setVehicleId(vehicleResult.value.content[0]?.id)
      }
      if (reviewResult.status === 'fulfilled') setReviews(reviewResult.value.content)
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [id])

  if (loading)
    return (
      <div className="parking-detail-loading">
        <Skeleton active />
      </div>
    )
  if (!lot) return <Empty description="Không tìm thấy bãi đỗ" />

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedSlot = lot.slots.find((s) => s.vehicleType === selectedVehicle?.vehicleType)
  const canBook = Boolean(selectedSlot && selectedSlot.totalCapacity > 0)
  const physicalFree = selectedSlot?.availableCapacity ?? 0
  const joinQ = async () => {
    if (!vehicleId || !lot || !selectedVehicle) return message.warning('Hãy chọn phương tiện')
    if (physicalFree > 0) {
      return message.info('Bãi còn chỗ vật lý — hãy đặt theo khung giờ thay vì xếp hàng.')
    }
    try {
      await joinQueue({ parkingLotId: lot.id, vehicleId, vehicleType: selectedVehicle.vehicleType })
      message.success('Đã tham gia hàng đợi')
      navigate('/queues')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tham gia hàng đợi')
    }
  }
  const galleryImages = (lot.images ?? []).slice(0, 3)
  const placeholders = [<Truck key="t" />, <Camera key="c" />, <ShieldCheck key="s" />]
  const peakRules = lot.pricingRules.filter(hasPeakWindow)

  return (
    <main className="lot-detail-stitch">
      <button className="lot-back" onClick={() => navigate('/parking')}>
        <ArrowLeft /> Quay lại kết quả
      </button>
      <div className="lot-detail-layout">
        <section className="lot-detail-main">
          <div className={`lot-gallery driver-lot-gallery${galleryImages.length ? ' has-photos' : ''}`}>
            {galleryImages.length > 0
              ? galleryImages.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.contentUrl}
                    alt={image.originalFileName || `${lot.name} ảnh ${index + 1}`}
                    loading="lazy"
                  />
                ))
              : placeholders.map((icon, index) => <div key={index}>{icon}</div>)}
          </div>
          <header className="lot-title">
            <div>
              <span className="approved-lot">
                <ShieldCheck /> Đã phê duyệt
              </span>
              <h1>{lot.name}</h1>
              <p>
                <MapPin /> {lot.address}
              </p>
              <p className="lot-rating">
                <Star fill="currentColor" /> {lot.ratingAverage.toFixed(1)}{' '}
                <span>
                  • {lot.distanceKm != null ? Number(lot.distanceKm).toFixed(2) : '—'} km · ETA {lot.etaMinutes} phút
                </span>
              </p>
            </div>
            <span className="lot-status">Mở cửa 24/7</span>
          </header>
          <p className="lot-description">{lot.description}</p>
          <section className="lot-amenities">
            <h2>Tiện ích bãi xe</h2>
            <div>
              {lot.amenities?.map((item) => (
                <span key={item}>
                  <ShieldCheck /> {item}
                </span>
              ))}
            </div>
          </section>
          <section className="lot-pricing">
            <h2>Bảng giá</h2>
            {peakRules.length > 0 && (
              <div className="lot-peak-banner">
                <Clock3 />
                <div>
                  <strong>Giờ cao điểm</strong>
                  <p>
                    {peakRules
                      .map(
                        (rule) =>
                          `${VEHICLE_TYPE_LABELS[rule.vehicleType]}: ${formatTime(rule.surgeStartTime)}–${formatTime(rule.surgeEndTime)} (×${Number(rule.surgeMultiplier).toFixed(2)})`,
                      )
                      .join(' · ')}
                  </p>
                </div>
              </div>
            )}
            <div className="lot-table">
              <header>
                <span>Loại xe</span>
                <span>Giá / giờ</span>
                <span>Cao điểm</span>
              </header>
              {lot.pricingRules.map((rule) => (
                <div key={rule.id}>
                  <span>
                    <Truck /> {VEHICLE_TYPE_LABELS[rule.vehicleType]}
                  </span>
                  <strong>{money(rule.basePricePerHour)}</strong>
                  <em>
                    {hasPeakWindow(rule)
                      ? `×${Number(rule.surgeMultiplier).toFixed(2)} · ${formatTime(rule.surgeStartTime)}–${formatTime(rule.surgeEndTime)}`
                      : Number(rule.surgeMultiplier) > 1
                        ? `×${Number(rule.surgeMultiplier).toFixed(2)} (mọi lúc)`
                        : 'Không áp dụng'}
                  </em>
                </div>
              ))}
            </div>
          </section>
          <section className="lot-reviews">
            <header>
              <div>
                <h2>Đánh giá từ tài xế</h2>
                <p>{reviews.length} đánh giá đã xác thực từ booking hoàn tất</p>
              </div>
              <strong>
                <Star fill="currentColor" /> {lot.ratingAverage.toFixed(1)}
              </strong>
            </header>
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id as number}>
                  <span>
                    <UserRound />
                  </span>
                  <div>
                    <strong>{(review.driverName as string) || 'Tài xế SmartTruck'}</strong>
                    <small>
                      {review.createdAt
                        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
                            new Date(review.createdAt as string),
                          )
                        : 'Gần đây'}
                    </small>
                    <div>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star key={value} fill={value <= (review.rating as number) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p>{(review.comment as string) || 'Không có nhận xét.'}</p>
                  </div>
                </article>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đánh giá cho bãi này" />
            )}
          </section>
        </section>
        <aside className="lot-booking-aside">
          <article className="lot-book-card">
            <label>
              Phương tiện của bạn
              <Select
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicles.map((v) => ({
                  value: v.id,
                  label: `${v.licensePlate}${v.brandModel ? ` · ${v.brandModel}` : ''} · ${VEHICLE_TYPE_LABELS[v.vehicleType]}`,
                }))}
              />
            </label>
            {canBook ? (
              <button className="book-btn" onClick={() => setBookingOpen(true)}>
                Đặt chỗ theo giờ
              </button>
            ) : null}
            {!canBook || physicalFree === 0 ? (
              <button className={canBook ? 'queue-btn secondary' : 'queue-btn'} onClick={joinQ}>
                Xếp hàng (chỗ vật lý)
              </button>
            ) : null}
            <p>
              {canBook
                ? physicalFree > 0
                  ? `Sức chứa ${selectedSlot?.totalCapacity} · đang trống vật lý ${physicalFree}. Đặt theo khung giờ.`
                  : `Sức chứa ${selectedSlot?.totalCapacity} · đang đầy vật lý. Vẫn có thể đặt giờ khác nếu chưa trùng.`
                : 'Bãi chưa cấu hình sức chứa cho phương tiện này'}
            </p>
          </article>
          <article className="lot-capacity">
            <h2>Sức chứa / chỗ đang trống</h2>
            {lot.slots.map((slot) => {
              const percent = slot.totalCapacity
                ? Math.round((slot.availableCapacity / slot.totalCapacity) * 100)
                : 0
              return (
                <div className="capacity-row" key={slot.id}>
                  <div>
                    <span>{VEHICLE_TYPE_LABELS[slot.vehicleType]}</span>
                    <strong>
                      {slot.availableCapacity}/{slot.totalCapacity} trống
                    </strong>
                  </div>
                  <Progress percent={percent} showInfo={false} />
                </div>
              )
            })}
          </article>
          <article className="lot-map-card">
            <MapPin />
            <strong>Chỉ đường</strong>
            <p>
              {lot.latitude}, {lot.longitude}
            </p>
            <a href={`https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`} target="_blank" rel="noreferrer">
              <Clock3 /> Mở Google Maps
            </a>
          </article>
        </aside>
      </div>
      <BookingFlowModal open={bookingOpen} lot={lot} vehicles={vehicles} onClose={() => setBookingOpen(false)} />
    </main>
  )
}

function money(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function formatTime(value?: string | null) {
  if (!value) return '--:--'
  return String(value).slice(0, 5)
}

function hasPeakWindow(rule: PricingRuleDto) {
  return Boolean(rule.surgeStartTime && rule.surgeEndTime && Number(rule.surgeMultiplier) > 1)
}

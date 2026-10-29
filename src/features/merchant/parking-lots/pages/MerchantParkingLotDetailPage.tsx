import { DollarOutlined, EditOutlined, ReloadOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Empty, Image, Progress, Skeleton, Table, Tag, Upload, message } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import type { BookingDto, BookingStatus } from '../../../bookings/types/bookingTypes'
import { getMerchantBookings } from '../../bookings/api/merchantBookingApi'
import { VEHICLE_TYPE_LABELS } from '../../../vehicles/types/vehicleTypes'
import {
  getMerchantParkingLotDetail,
  getMerchantParkingLotPricing,
  getMerchantParkingLotRevenue,
  getMerchantParkingLotSlots,
  uploadMerchantParkingLotImages,
  type MerchantRevenue,
} from '../api/merchantParkingLotApi'
import type { MerchantParkingLot, MerchantPricingRule, MerchantSlot, ParkingLotImage, ParkingLotStatus } from '../types/merchantParkingLotTypes'

const statusMeta: Record<ParkingLotStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: 'Đang chờ duyệt', color: 'gold' },
  CHANGES_REQUESTED: { label: 'Cần bổ sung', color: 'purple' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Bị từ chối', color: 'red' },
  SUSPENDED: { label: 'Tạm ngưng', color: 'default' },
}

const bookingStatusMeta: Record<BookingStatus, { label: string; color: string }> = {
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

const ACTIVE_VEHICLE_STATUSES: BookingStatus[] = ['PENDING_CHECKIN', 'PARKING', 'OVERTIME']

export function MerchantParkingLotDetailPage() {
  const { parkingLotId } = useParams()
  const navigate = useNavigate()
  const id = Number(parkingLotId)
  const [lot, setLot] = useState<MerchantParkingLot | null>(null)
  const [slots, setSlots] = useState<MerchantSlot[]>([])
  const [pricing, setPricing] = useState<MerchantPricingRule[]>([])
  const [revenue, setRevenue] = useState<MerchantRevenue | null>(null)
  const [images, setImages] = useState<ParkingLotImage[]>([])
  const [vehicles, setVehicles] = useState<BookingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ownershipVerified, setOwnershipVerified] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setErrors({ detail: 'ID bãi không hợp lệ.' })
      setLoading(false)
      return
    }
    setLoading(true)
    setErrors({})
    setOwnershipVerified(false)
    const [detailResult, slotResult, pricingResult, revenueResult, bookingResult] = await Promise.allSettled([
      getMerchantParkingLotDetail(id),
      getMerchantParkingLotSlots(id),
      getMerchantParkingLotPricing(id),
      getMerchantParkingLotRevenue(id),
      getMerchantBookings(0, 100, id),
    ])
    const nextErrors: Record<string, string> = {}
    if (detailResult.status === 'fulfilled') {
      setLot(detailResult.value)
      setImages(detailResult.value.images ?? [])
      setOwnershipVerified(true)
    } else {
      nextErrors.detail = extractApiError(detailResult.reason as AxiosError)
    }
    if (slotResult.status === 'fulfilled') setSlots(slotResult.value)
    else nextErrors.slots = extractApiError(slotResult.reason as AxiosError)
    if (pricingResult.status === 'fulfilled') setPricing(pricingResult.value)
    else nextErrors.pricing = extractApiError(pricingResult.reason as AxiosError)
    if (revenueResult.status === 'fulfilled') {
      setRevenue(revenueResult.value)
    } else {
      nextErrors.revenue = extractApiError(revenueResult.reason as AxiosError)
    }
    if (bookingResult.status === 'fulfilled') setVehicles(bookingResult.value.content)
    else nextErrors.vehicles = extractApiError(bookingResult.reason as AxiosError)
    setErrors(nextErrors)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  const activeVehicles = useMemo(
    () => vehicles.filter((item) => Number(item.parkingLotId) === Number(id) && ACTIVE_VEHICLE_STATUSES.includes(item.status)),
    [vehicles, id],
  )

  const handleUpload = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded = await uploadMerchantParkingLotImages(id, files)
      message.success(`Đã upload ${uploaded.length} ảnh`)
      await load()
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} />
  if (!lot) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải bãi đỗ"
        description={errors.detail}
        action={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Thử lại</Button>}
      />
    )
  }
  const status = statusMeta[lot.status]
  const canConfigure = ownershipVerified && lot.status === 'APPROVED'

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <Tag color={status.color}>{status.label}</Tag>
          <h1>{lot.name}</h1>
          <p>{lot.address}</p>
        </div>
        <div className="merchant-header-actions">
          <Button disabled={!ownershipVerified} icon={<EditOutlined />} onClick={() => navigate('edit')}>Chỉnh sửa</Button>
          <Button disabled={!canConfigure} icon={<SettingOutlined />} onClick={() => navigate('slots')}>Slot</Button>
          <Button disabled={!canConfigure} icon={<DollarOutlined />} onClick={() => navigate('pricing')}>Bảng giá</Button>
        </div>
      </header>

      {!ownershipVerified && (
        <Alert type="warning" showIcon message="Chưa xác minh được quyền sở hữu" description={errors.detail ?? 'Action quản trị bị khóa do không thể xác minh quyền sở hữu.'} />
      )}
      {lot.status === 'PENDING_APPROVAL' && (
        <Alert
          type="info"
          showIcon
          message="Đang chờ Admin duyệt bãi đỗ"
          description="Sau khi Admin phê duyệt, bạn mới được cấu hình Slot và Bảng giá để mở nhận đặt chỗ."
        />
      )}
      {lot.status === 'REJECTED' && (
        <Alert type="error" showIcon message="Hồ sơ bãi đã bị từ chối" description={lot.reviewReason || 'Vui lòng chỉnh sửa hồ sơ rồi gửi lại.'} action={<Button type="primary" danger onClick={() => navigate('edit')}>Chỉnh sửa hồ sơ</Button>} />
      )}
      {lot.status === 'CHANGES_REQUESTED' && (
        <Alert type="warning" showIcon message="Admin yêu cầu bổ sung hồ sơ" description={lot.reviewReason || 'Vui lòng cập nhật thông tin rồi gửi lại.'} action={<Button type="primary" onClick={() => navigate('edit')}>Bổ sung hồ sơ</Button>} />
      )}
      {lot.status === 'SUSPENDED' && (
        <Alert type="warning" showIcon message="Bãi đang bị tạm ngưng" description="Các action vận hành đã bị khóa." />
      )}

      <section className="merchant-detail-card">
        <div className="merchant-section-title">
          <div>
            <h2>Hình ảnh bãi đỗ</h2>
            <p>Ảnh upload sẽ hiển thị cho tài xế trên trang chi tiết bãi.</p>
          </div>
          <Upload
            accept="image/jpeg,image/png,image/webp"
            multiple
            showUploadList={false}
            disabled={!ownershipVerified || uploading}
            beforeUpload={(file) => {
              void handleUpload([file])
              return false
            }}
          >
            <Button icon={<UploadOutlined />} loading={uploading} disabled={!ownershipVerified}>
              Thêm ảnh
            </Button>
          </Upload>
        </div>
        {images.length === 0 ? (
          <Empty description="Chưa có ảnh. Hãy upload ảnh bãi đỗ." />
        ) : (
          <Image.PreviewGroup>
            <div className="merchant-parking-gallery">
              {images.map((image) => (
                <figure key={image.id} className={image.cover ? 'is-cover' : undefined}>
                  <Image
                    src={image.contentUrl}
                    alt={image.originalFileName || `Ảnh bãi #${image.id}`}
                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='320' height='200' fill='%23f2f4f7'/%3E%3Ctext x='160' y='100' text-anchor='middle' fill='%23667085'%3EKhông tải được ảnh%3C/text%3E%3C/svg%3E"
                  />
                  {image.cover && <Tag color="green">Ảnh đại diện</Tag>}
                </figure>
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </section>

      <section className="merchant-detail-grid">
        <article className="merchant-detail-card">
          <h2>Thông tin bãi</h2>
          <Descriptions
            column={1}
            items={[
              { key: 'id', label: 'ID', children: lot.id },
              { key: 'address', label: 'Địa chỉ', children: lot.address },
              { key: 'coordinates', label: 'Tọa độ', children: `${lot.latitude}, ${lot.longitude}` },
              { key: 'rating', label: 'Đánh giá', children: lot.ratingAverage ?? 'Chưa có' },
            ]}
          />
        </article>
        <article className="merchant-detail-card">
          <h2>Doanh thu</h2>
          {errors.revenue ? (
            <Alert type="error" showIcon message={errors.revenue} />
          ) : (
            <>
              <strong className="merchant-money">{formatMoney(revenue?.totalRevenue ?? 0)}</strong>
              <p>{revenue?.completedBookings ?? 0} booking hoàn thành</p>
            </>
          )}
        </article>
      </section>

      <section className="merchant-detail-card">
        <div className="merchant-section-title">
          <div>
            <h2>Xe tại bãi</h2>
            <p>Danh sách xe đang liên quan tới bãi: biển số, tên chủ xe và số điện thoại.</p>
          </div>
          <Button onClick={() => navigate(`/merchant/bookings?parkingLotId=${id}`)}>Tất cả booking của bãi</Button>
        </div>
        {errors.vehicles ? (
          <Alert type="error" showIcon message={errors.vehicles} />
        ) : (
          <Table
            rowKey="id"
            pagination={false}
            dataSource={activeVehicles}
            locale={{ emptyText: <Empty description="Chưa có xe chờ check-in / đang đỗ tại bãi này" /> }}
            columns={[
              {
                title: 'Biển số',
                dataIndex: 'vehicleLicensePlate',
                key: 'vehicleLicensePlate',
                render: (plate: string, item: BookingDto) => (
                  <span>
                    <strong>{plate}</strong>
                    <br />
                    <small>{VEHICLE_TYPE_LABELS[item.vehicleType]}</small>
                  </span>
                ),
              },
              {
                title: 'Chủ xe / Tài xế',
                dataIndex: 'driverName',
                key: 'driverName',
                render: (name: string) => name || '—',
              },
              {
                title: 'SĐT',
                dataIndex: 'driverPhone',
                key: 'driverPhone',
                render: (phone?: string | null) =>
                  phone ? <a href={`tel:${phone}`}>{phone}</a> : '—',
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: BookingStatus) => (
                  <Tag color={bookingStatusMeta[status].color}>{bookingStatusMeta[status].label}</Tag>
                ),
              },
              {
                title: '',
                key: 'action',
                width: 100,
                render: (_, item) => (
                  <Button type="link" onClick={() => navigate(`/merchant/bookings/${item.id}`)}>
                    Chi tiết
                  </Button>
                ),
              },
            ]}
          />
        )}
      </section>

      <section className="merchant-detail-card">
        <div className="merchant-section-title">
          <div>
            <h2>Sức chứa</h2>
            <p>Tổng, còn trống và đang sử dụng theo loại xe.</p>
          </div>
          <Button disabled={!canConfigure} onClick={() => navigate('slots')}>Quản lý slot</Button>
        </div>
        {errors.slots ? (
          <Alert type="error" showIcon message={errors.slots} />
        ) : slots.length === 0 ? (
          <Empty description="Chưa cấu hình slot" />
        ) : (
          <div className="merchant-capacity-grid">
            {slots.map((slot) => {
              const occupied = slot.totalCapacity - slot.availableCapacity
              return (
                <article key={slot.id}>
                  <strong>{VEHICLE_TYPE_LABELS[slot.vehicleType]}</strong>
                  <span>{slot.availableCapacity}/{slot.totalCapacity} chỗ trống</span>
                  <Progress percent={slot.totalCapacity ? Math.round((slot.availableCapacity / slot.totalCapacity) * 100) : 0} />
                  <small>Đang sử dụng: {Math.max(0, occupied)}</small>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="merchant-detail-card">
        <div className="merchant-section-title">
          <div>
            <h2>Bảng giá</h2>
            <p>Giá và hệ số hiện hành từ backend.</p>
          </div>
          <Button disabled={!canConfigure} onClick={() => navigate('pricing')}>Cấu hình giá</Button>
        </div>
        {errors.pricing ? (
          <Alert type="error" showIcon message={errors.pricing} />
        ) : (
          <Table
            rowKey="id"
            pagination={false}
            dataSource={pricing}
            locale={{ emptyText: <Empty description="Chưa cấu hình bảng giá" /> }}
            columns={[
              { title: 'Loại xe', dataIndex: 'vehicleType', render: (value) => VEHICLE_TYPE_LABELS[value as keyof typeof VEHICLE_TYPE_LABELS] },
              { title: 'Giá/giờ', dataIndex: 'basePricePerHour', render: (value) => formatMoney(Number(value)) },
              { title: 'Cao điểm', dataIndex: 'surgeMultiplier', render: (value, row) => {
                const start = row.surgeStartTime ? String(row.surgeStartTime).slice(0, 5) : null
                const end = row.surgeEndTime ? String(row.surgeEndTime).slice(0, 5) : null
                if (start && end) return `×${value} · ${start}–${end}`
                return Number(value) > 1 ? `×${value} (mọi lúc)` : '—'
              } },
              { title: 'Quá giờ', dataIndex: 'overtimePenaltyMultiplier', render: (value) => `×${value}` },
            ]}
          />
        )}
      </section>
    </main>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

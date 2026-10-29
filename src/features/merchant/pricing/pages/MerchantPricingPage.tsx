import { ArrowLeftOutlined, CalculatorOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, InputNumber, Popconfirm, Select, Skeleton, Tag, message } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { VEHICLE_TYPE_LABELS, type VehicleType } from '../../../vehicles/types/vehicleTypes'
import { configureAllMerchantParkingLotPricing, getMerchantParkingLotDetail, getMerchantParkingLotPricing } from '../../parking-lots/api/merchantParkingLotApi'
import type { ConfigurePricingRequest, MerchantPricingRule } from '../../parking-lots/types/merchantParkingLotTypes'

const vehicleTypes = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]

type PricingDraft = {
  vehicleType: VehicleType
  basePricePerHour: number | null
  surgeMultiplier: number
  surgeStartTime: string | null
  surgeEndTime: string | null
  overtimePenaltyMultiplier: number
}

type PricingDrafts = Record<VehicleType, PricingDraft>

function emptyDrafts(): PricingDrafts {
  return Object.fromEntries(vehicleTypes.map(vehicleType => [vehicleType, {
    vehicleType,
    basePricePerHour: null,
    surgeMultiplier: 1,
    surgeStartTime: null,
    surgeEndTime: null,
    overtimePenaltyMultiplier: 2,
  }])) as PricingDrafts
}

export function MerchantPricingPage() {
  const { parkingLotId } = useParams()
  const id = Number(parkingLotId)
  const navigate = useNavigate()
  const [rules, setRules] = useState<MerchantPricingRule[]>([])
  const [drafts, setDrafts] = useState<PricingDrafts>(emptyDrafts)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [approved, setApproved] = useState(true)
  const [previewType, setPreviewType] = useState<VehicleType>('LIGHT_TRUCK')
  const [hours, setHours] = useState(1)
  const [overtimeHours, setOvertimeHours] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [lot, data] = await Promise.all([getMerchantParkingLotDetail(id), getMerchantParkingLotPricing(id)])
      setApproved(lot.status === 'APPROVED')
      setRules(data)
      const nextDrafts = emptyDrafts()
      data.forEach(rule => {
        nextDrafts[rule.vehicleType] = {
          vehicleType: rule.vehicleType,
          basePricePerHour: Number(rule.basePricePerHour),
          surgeMultiplier: Number(rule.surgeMultiplier ?? 1),
          surgeStartTime: rule.surgeStartTime ? String(rule.surgeStartTime).slice(0, 5) : null,
          surgeEndTime: rule.surgeEndTime ? String(rule.surgeEndTime).slice(0, 5) : null,
          overtimePenaltyMultiplier: Number(rule.overtimePenaltyMultiplier ?? 2),
        }
      })
      setDrafts(nextDrafts)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const current = drafts[previewType]
  const preview = useMemo(() => {
    const basePrice = current.basePricePerHour ?? 0
    const baseAmount = hours * basePrice * current.surgeMultiplier
    const overtimeAmount = overtimeHours * basePrice * current.overtimePenaltyMultiplier
    return { baseAmount, overtimeAmount, total: baseAmount + overtimeAmount }
  }, [current, hours, overtimeHours])

  const update = (vehicleType: VehicleType, field: keyof Omit<PricingDraft, 'vehicleType'>, value: number | null) => {
    setDrafts(previous => ({
      ...previous,
      [vehicleType]: { ...previous[vehicleType], [field]: value },
    }))
  }

  const buildRequests = (): ConfigurePricingRequest[] | undefined => {
    const configuredDrafts = vehicleTypes.map(vehicleType => drafts[vehicleType]).filter(draft => draft.basePricePerHour !== null)
    if (!configuredDrafts.length) {
      message.error('Vui lòng nhập giá cơ bản cho ít nhất một loại xe.')
      return undefined
    }
    const requests: ConfigurePricingRequest[] = []
    for (const draft of configuredDrafts) {
      if (draft.basePricePerHour === null || draft.basePricePerHour <= 0) {
        message.error(`${VEHICLE_TYPE_LABELS[draft.vehicleType]}: giá cơ bản phải lớn hơn 0.`)
        return undefined
      }
      if (draft.surgeMultiplier < 1 || draft.surgeMultiplier > 9.99) {
        message.error(`${VEHICLE_TYPE_LABELS[draft.vehicleType]}: hệ số giá áp dụng phải từ 1.00 đến 9.99.`)
        return undefined
      }
      if (draft.overtimePenaltyMultiplier < 1 || draft.overtimePenaltyMultiplier > 9.99) {
        message.error(`${VEHICLE_TYPE_LABELS[draft.vehicleType]}: hệ số quá giờ phải từ 1.00 đến 9.99.`)
        return undefined
      }
      const hasStart = Boolean(draft.surgeStartTime)
      const hasEnd = Boolean(draft.surgeEndTime)
      if (hasStart !== hasEnd) {
        message.error(`${VEHICLE_TYPE_LABELS[draft.vehicleType]}: phải nhập đủ giờ bắt đầu/kết thúc cao điểm hoặc để trống cả hai.`)
        return undefined
      }
      requests.push({
        vehicleType: draft.vehicleType,
        basePricePerHour: draft.basePricePerHour,
        surgeMultiplier: draft.surgeMultiplier,
        surgeStartTime: draft.surgeStartTime ? `${draft.surgeStartTime}:00` : null,
        surgeEndTime: draft.surgeEndTime ? `${draft.surgeEndTime}:00` : null,
        overtimePenaltyMultiplier: draft.overtimePenaltyMultiplier,
      })
    }
    return requests
  }

  const saveAll = async () => {
    if (!approved) {
      message.warning('Bãi chưa được Admin duyệt — chưa thể lưu bảng giá.')
      return
    }
    const pricingRules = buildRequests()
    if (!pricingRules) return
    setSaving(true)
    try {
      await configureAllMerchantParkingLotPricing(id, { pricingRules })
      message.success(`Đã lưu ${pricingRules.length} bảng giá.`)
      await load()
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />

  return <main className="merchant-page-stack">
    <header className="merchant-page-header">
      <div><h1>Cấu hình bảng giá</h1><p>Thiết lập giá riêng cho từng loại xe. Đơn vị tiền tệ: VND.</p></div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/merchant/parking-lots/${id}`)}>Chi tiết bãi</Button>
    </header>

    {!approved && (
      <Alert
        type="warning"
        showIcon
        message="Bãi chưa được Admin duyệt"
        description="Sau khi Admin phê duyệt, bạn mới được cấu hình và lưu bảng giá."
        action={<Button onClick={() => navigate(`/merchant/parking-lots/${id}`)}>Về chi tiết bãi</Button>}
      />
    )}

    <Alert type="info" showIcon message="Cách dùng hệ số cao điểm" description="Để trống khung giờ → hệ số áp dụng mọi lúc. Nhập giờ bắt đầu/kết thúc (HH:mm) → chỉ cộng hệ số trong khung đó (hỗ trợ qua đêm, ví dụ 22:00–06:00)." />
    {error && <Alert type="error" showIcon message="Không thể tải bảng giá" description={error} action={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Thử lại</Button>} />}

    {!error && approved && <section className="merchant-pricing-grid">{vehicleTypes.map(vehicleType => {
      const draft = drafts[vehicleType]
      const exists = rules.some(rule => rule.vehicleType === vehicleType)
      return <article className="merchant-pricing-card" key={vehicleType}>
        <header><strong>{VEHICLE_TYPE_LABELS[vehicleType]}</strong><Tag color={exists ? 'green' : 'default'}>{exists ? 'Đã cấu hình' : 'Chưa lưu'}</Tag></header>
        <label>Giá cơ bản mỗi giờ
          <InputNumber min={1} max={99999999} precision={0} value={draft.basePricePerHour} placeholder="Ví dụ: 20.000" addonAfter="VND" formatter={value => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={value => Number((value ?? '').replace(/\./g, ''))} onChange={value => update(vehicleType, 'basePricePerHour', value)} />
          <small className="merchant-field-hint">Số tiền cho một giờ đỗ xe thông thường.</small>
        </label>
        <label>Hệ số giá cao điểm
          <InputNumber min={1} max={9.99} step={0.1} precision={2} value={draft.surgeMultiplier} onChange={value => update(vehicleType, 'surgeMultiplier', value ?? 1)} />
          <small className="merchant-field-hint">{multiplierExplanation(draft.surgeMultiplier)}</small>
        </label>
        <label>Giờ bắt đầu cao điểm
          <input
            className="ant-input"
            type="time"
            value={draft.surgeStartTime ?? ''}
            onChange={event => setDrafts(previous => ({
              ...previous,
              [vehicleType]: { ...previous[vehicleType], surgeStartTime: event.target.value || null },
            }))}
          />
        </label>
        <label>Giờ kết thúc cao điểm
          <input
            className="ant-input"
            type="time"
            value={draft.surgeEndTime ?? ''}
            onChange={event => setDrafts(previous => ({
              ...previous,
              [vehicleType]: { ...previous[vehicleType], surgeEndTime: event.target.value || null },
            }))}
          />
        </label>
        <label>Hệ số quá giờ
          <InputNumber min={1} max={9.99} step={0.1} precision={2} value={draft.overtimePenaltyMultiplier} onChange={value => update(vehicleType, 'overtimePenaltyMultiplier', value ?? 1)} />
          <small className="merchant-field-hint">Mỗi giờ quá hạn bằng {draft.overtimePenaltyMultiplier.toFixed(2)} lần giá cơ bản.</small>
        </label>
      </article>
    })}</section>}

    {!error && approved && <footer className="merchant-form-actions">
      <span className="merchant-save-note">Các loại xe chưa nhập giá sẽ không được gửi lên Backend.</span>
      <Popconfirm title="Lưu tất cả bảng giá?" description="Tất cả dòng đã nhập giá sẽ được lưu trong cùng một giao dịch." onConfirm={() => void saveAll()} okText="Lưu tất cả" cancelText="Hủy">
        <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={saving}>Lưu tất cả bảng giá</Button>
      </Popconfirm>
    </footer>}

    {!error && approved && <section className="merchant-detail-card">
      <div className="merchant-section-title"><div><h2><CalculatorOutlined /> Xem trước cách tính</h2><p>Kết quả thay đổi ngay theo dữ liệu đang nhập; không cần lưu trước.</p></div></div>
      <div className="merchant-preview-form">
        <Select value={previewType} onChange={setPreviewType} options={vehicleTypes.map(value => ({ value, label: VEHICLE_TYPE_LABELS[value] }))} />
        <InputNumber min={0} precision={0} value={hours} onChange={value => setHours(value ?? 0)} addonAfter="giờ đỗ" />
        <InputNumber min={0} precision={0} value={overtimeHours} onChange={value => setOvertimeHours(value ?? 0)} addonAfter="giờ vượt dự kiến" />
      </div>
      {current.basePricePerHour ? <div className="merchant-pricing-preview">
        <p>Tiền đỗ: {hours} × {formatMoney(current.basePricePerHour)} × {current.surgeMultiplier.toFixed(2)} = <strong>{formatMoney(preview.baseAmount)}</strong></p>
        <p>Phí quá giờ: {overtimeHours} × {formatMoney(current.basePricePerHour)} × {current.overtimePenaltyMultiplier.toFixed(2)} = <strong>{formatMoney(preview.overtimeAmount)}</strong></p>
        <span>Tổng dự kiến</span><strong className="merchant-money">{formatMoney(preview.total)}</strong>
      </div> : <Empty description={`Nhập giá cơ bản cho ${VEHICLE_TYPE_LABELS[previewType]} để xem trước`} />}
    </section>}
  </main>
}

function multiplierExplanation(value: number) {
  if (value === 1) return '1.00 = giữ nguyên giá cơ bản.'
  return `${value.toFixed(2)} = tăng ${Math.round((value - 1) * 100)}% so với giá cơ bản.`
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

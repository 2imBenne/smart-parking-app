import { ArrowLeftOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, InputNumber, Popconfirm, Progress, Skeleton, message } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { VEHICLE_TYPE_LABELS, type VehicleType } from '../../../vehicles/types/vehicleTypes'
import {
  configureAllMerchantParkingLotSlots,
  getMerchantParkingLotDetail,
  getMerchantParkingLotSlots,
} from '../../parking-lots/api/merchantParkingLotApi'
import type { ConfigureSlotRequest, MerchantSlot } from '../../parking-lots/types/merchantParkingLotTypes'

const vehicleTypes = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]

export function MerchantSlotsPage() {
  const { parkingLotId } = useParams()
  const id = Number(parkingLotId)
  const navigate = useNavigate()
  const [slots, setSlots] = useState<MerchantSlot[]>([])
  const [drafts, setDrafts] = useState<Partial<Record<VehicleType, number>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [approved, setApproved] = useState(true)

  const byType = useMemo(() => new Map(slots.map((slot) => [slot.vehicleType, slot])), [slots])
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [lot, data] = await Promise.all([getMerchantParkingLotDetail(id), getMerchantParkingLotSlots(id)])
      setApproved(lot.status === 'APPROVED')
      setSlots(data)
      setDrafts(Object.fromEntries(data.map((slot) => [slot.vehicleType, slot.totalCapacity])))
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  const buildRequest = (): ConfigureSlotRequest[] | undefined => {
    const requests = vehicleTypes.map((vehicleType) => ({
      vehicleType,
      totalCapacity: drafts[vehicleType] ?? byType.get(vehicleType)?.totalCapacity ?? 0,
    }))
    for (const request of requests) {
      const current = byType.get(request.vehicleType)
      const occupied = current ? current.totalCapacity - current.availableCapacity : 0
      if (!Number.isInteger(request.totalCapacity) || request.totalCapacity < 0) {
        message.error(`${VEHICLE_TYPE_LABELS[request.vehicleType]}: tổng sức chứa phải là số nguyên không âm.`)
        return undefined
      }
      if (request.totalCapacity < occupied) {
        message.error(`${VEHICLE_TYPE_LABELS[request.vehicleType]}: không thể giảm dưới ${occupied} chỗ đang sử dụng.`)
        return undefined
      }
    }
    return requests
  }

  const hasChanges = vehicleTypes.some(
    (vehicleType) =>
      (drafts[vehicleType] ?? byType.get(vehicleType)?.totalCapacity ?? 0) !==
      (byType.get(vehicleType)?.totalCapacity ?? 0),
  )
  const hasDecrease = vehicleTypes.some((vehicleType) => {
    const current = byType.get(vehicleType)
    return Boolean(current && (drafts[vehicleType] ?? current.totalCapacity) < current.totalCapacity)
  })

  const saveAll = async () => {
    if (!approved) {
      message.warning('Bãi chưa được Admin duyệt — chưa thể lưu cấu hình slot.')
      return
    }
    const requests = buildRequest()
    if (!requests) return
    if (!hasChanges) {
      message.info('Dữ liệu không thay đổi.')
      return
    }
    setSaving(true)
    try {
      const updatedSlots = await configureAllMerchantParkingLotSlots(id, { slots: requests })
      setSlots(updatedSlots)
      setDrafts(Object.fromEntries(updatedSlots.map((slot) => [slot.vehicleType, slot.totalCapacity])))
      message.success('Đã lưu toàn bộ cấu hình sức chứa.')
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />
  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Cấu hình sức chứa</h1>
          <p>Thiết lập sức chứa theo loại xe và lưu tất cả trong một lần.</p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/merchant/parking-lots/${id}`)}>
          Chi tiết bãi
        </Button>
      </header>
      {!approved && (
        <Alert
          type="warning"
          showIcon
          message="Bãi chưa được Admin duyệt"
          description="Sau khi Admin phê duyệt, bạn mới được cấu hình và lưu slot."
          action={
            <Button onClick={() => navigate(`/merchant/parking-lots/${id}`)}>Về chi tiết bãi</Button>
          }
        />
      )}
      <Alert
        type="info"
        showIcon
        message="Số chỗ đang sử dụng được bảo toàn"
        description="Khi thay đổi tổng sức chứa, hệ thống tự tính lại số chỗ trống và không cho giảm thấp hơn số xe đang đỗ."
      />
      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải slot"
          description={error}
          action={
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              Thử lại
            </Button>
          }
        />
      )}
      {!error && approved && (
        <>
          <section className="merchant-slot-grid">
            {vehicleTypes.map((vehicleType) => {
              const current = byType.get(vehicleType)
              const occupied = current ? Math.max(0, current.totalCapacity - current.availableCapacity) : 0
              const next = drafts[vehicleType] ?? current?.totalCapacity ?? 0
              return (
                <article className="merchant-slot-card" key={vehicleType}>
                  <header>
                    <div>
                      <strong>{VEHICLE_TYPE_LABELS[vehicleType]}</strong>
                      <small>{current ? 'Đã cấu hình' : 'Chưa cấu hình'}</small>
                    </div>
                    <span>
                      {current?.availableCapacity ?? 0}/{current?.totalCapacity ?? 0} trống
                    </span>
                  </header>
                  {current ? (
                    <>
                      <Progress
                        percent={
                          current.totalCapacity
                            ? Math.round((current.availableCapacity / current.totalCapacity) * 100)
                            : 0
                        }
                      />
                      <p>
                        Đang sử dụng: <strong>{occupied}</strong>
                      </p>
                    </>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />
                  )}
                  <label>
                    Tổng sức chứa mới
                    <InputNumber
                      min={occupied}
                      precision={0}
                      value={next}
                      onChange={(value) =>
                        setDrafts((previous) => ({ ...previous, [vehicleType]: value ?? 0 }))
                      }
                    />
                  </label>
                </article>
              )
            })}
          </section>
          <footer className="merchant-form-actions">
            <Popconfirm
              title="Lưu toàn bộ cấu hình?"
              description={
                hasDecrease
                  ? 'Một hoặc nhiều loại xe đang được giảm sức chứa. Số chỗ đang sử dụng vẫn được giữ nguyên.'
                  : 'Tất cả thay đổi sẽ được lưu trong cùng một giao dịch.'
              }
              onConfirm={() => void saveAll()}
              okText="Lưu tất cả"
              cancelText="Hủy"
            >
              <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={saving || !hasChanges}>
                Lưu tất cả
              </Button>
            </Popconfirm>
          </footer>
        </>
      )}
    </main>
  )
}

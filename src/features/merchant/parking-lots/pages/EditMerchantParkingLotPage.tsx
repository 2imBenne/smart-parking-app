import { AimOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Form, Input, InputNumber, Skeleton, Tag, message } from 'antd'
import type { AxiosError } from 'axios'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import {
  getMerchantParkingLotDetail,
  updateMerchantParkingLot,
} from '../api/merchantParkingLotApi'
import type {
  CreateMerchantParkingLotRequest,
  MerchantParkingLot,
  ParkingLotStatus,
} from '../types/merchantParkingLotTypes'

const ParkingLotMapPicker = lazy(() =>
  import('../components/ParkingLotMapPicker').then(module => ({ default: module.ParkingLotMapPicker })),
)

const editableStatuses: ParkingLotStatus[] = ['REJECTED', 'CHANGES_REQUESTED']

export function EditMerchantParkingLotPage() {
  const { parkingLotId } = useParams()
  const id = Number(parkingLotId)
  const navigate = useNavigate()
  const [form] = Form.useForm<CreateMerchantParkingLotRequest>()
  const [lot, setLot] = useState<MerchantParkingLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const values = Form.useWatch([], form) as CreateMerchantParkingLotRequest | undefined

  useEffect(() => {
    let active = true
    setLoading(true)
    void getMerchantParkingLotDetail(id)
      .then((data) => {
        if (!active) return
        setLot(data)
        form.setFieldsValue({
          name: data.name,
          address: data.address,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        })
      })
      .catch((requestError) => {
        if (active) setError(extractApiError(requestError as AxiosError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [form, id])

  const locate = () => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt không hỗ trợ định vị.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        form.setFieldsValue({
          latitude: Number(coords.latitude.toFixed(7)),
          longitude: Number(coords.longitude.toFixed(7)),
        })
        message.success('Đã cập nhật vị trí hiện tại.')
        setLocating(false)
      },
      () => {
        message.error('Không lấy được vị trí hiện tại.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const submit = async () => {
    if (!lot || !editableStatuses.includes(lot.status)) {
      message.warning('Chỉ chỉnh sửa được hồ sơ bị từ chối hoặc cần bổ sung.')
      return
    }
    setSubmitting(true)
    try {
      const request = await form.validateFields()
      const updated = await updateMerchantParkingLot(id, request)
      message.success('Đã gửi lại hồ sơ. Bãi đang chờ phê duyệt.')
      navigate(`/merchant/parking-lots/${updated.id}`, { replace: true })
    } catch (requestError) {
      if (!(requestError as { errorFields?: unknown }).errorFields) {
        message.error(extractApiError(requestError as AxiosError))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (error || !lot) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được hồ sơ bãi đỗ"
        description={error || 'Không tìm thấy bãi đỗ'}
        action={<Button onClick={() => navigate('/merchant/parking-lots')}>Quay lại</Button>}
      />
    )
  }

  const canEdit = editableStatuses.includes(lot.status)

  return (
    <main className="merchant-page-stack merchant-form-page">
      <header className="merchant-page-header">
        <div>
          <h1>Chỉnh sửa bãi đỗ</h1>
          <p>Cập nhật thông tin và gửi lại để Admin kiểm duyệt.</p>
        </div>
        <Tag color={canEdit ? 'gold' : 'default'}>{lot.status}</Tag>
      </header>

      {!canEdit && (
        <Alert
          type="warning"
          showIcon
          message="Hồ sơ hiện không thể chỉnh sửa"
          description="Chỉ chỉnh sửa khi trạng thái là REJECTED hoặc CHANGES_REQUESTED."
        />
      )}
      {lot.reviewReason && (
        <Alert type="info" showIcon message="Ghi chú kiểm duyệt gần nhất" description={lot.reviewReason} />
      )}

      <Form form={form} layout="vertical" requiredMark="optional" className="merchant-form-card" disabled={!canEdit}>
        <Form.Item name="name" label="Tên bãi" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên bãi' }]}>
          <Input maxLength={150} />
        </Form.Item>
        <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập địa chỉ' }]}>
          <Input.TextArea rows={3} maxLength={300} />
        </Form.Item>
        <div className="merchant-section-title">
          <div>
            <h2>Vị trí bãi</h2>
          </div>
          <Button icon={<AimOutlined />} loading={locating} onClick={locate} disabled={!canEdit}>
            Vị trí hiện tại
          </Button>
        </div>
        <div className="merchant-two-columns">
          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[{ required: true, message: 'Vui lòng nhập latitude' }, { type: 'number', min: -90, max: 90 }]}
          >
            <InputNumber stringMode={false} step={0.0000001} precision={7} min={-90} max={90} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[{ required: true, message: 'Vui lòng nhập longitude' }, { type: 'number', min: -180, max: 180 }]}
          >
            <InputNumber stringMode={false} step={0.0000001} precision={7} min={-180} max={180} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Suspense fallback={<div className="merchant-map-loading">Đang tải bản đồ…</div>}>
          <ParkingLotMapPicker
            latitude={values?.latitude}
            longitude={values?.longitude}
            onChange={(latitude, longitude) => form.setFieldsValue({ latitude, longitude })}
          />
        </Suspense>
        <Descriptions
          className="merchant-inline-alert"
          bordered
          column={1}
          items={[
            { key: 'status', label: 'Trạng thái sau lưu', children: <Tag color="gold">PENDING_APPROVAL</Tag> },
          ]}
        />
        <footer className="merchant-form-actions">
          <Button onClick={() => navigate(`/merchant/parking-lots/${id}`)}>Hủy</Button>
          <Button type="primary" loading={submitting} disabled={!canEdit || submitting} onClick={() => void submit()}>
            Gửi lại hồ sơ
          </Button>
        </footer>
      </Form>
    </main>
  )
}

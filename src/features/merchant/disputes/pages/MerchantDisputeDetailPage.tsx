import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Skeleton, Tag } from 'antd'
import type { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantDisputeDetail } from '../api/merchantDisputeApi'
import type { MerchantDispute, MerchantDisputeStatus } from '../types/merchantDisputeTypes'

const statusMeta: Record<MerchantDisputeStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  REVIEWING: { label: 'Đang xem xét', color: 'blue' },
  RESOLVED: { label: 'Đã giải quyết', color: 'green' },
  REJECTED: { label: 'Đã từ chối', color: 'red' },
}

function formatOptionalDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export function MerchantDisputeDetailPage() {
  const { ticketId } = useParams()
  const id = Number(ticketId)
  const navigate = useNavigate()
  const [item, setItem] = useState<MerchantDispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setItem(await getMerchantDisputeDetail(id))
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setItem(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [id])

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />
  if (error || !item) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được chi tiết tranh chấp"
        description={error || 'Không tìm thấy ticket'}
        action={
          <>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>Thử lại</Button>
            <Button onClick={() => navigate('/merchant/disputes')}>Danh sách</Button>
          </>
        }
      />
    )
  }

  const status = statusMeta[item.status] ?? { label: item.status, color: 'default' }

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <Tag color={status.color}>{status.label}</Tag>
          <h1>DSP-{item.id}</h1>
          <p>{item.reason}</p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant/disputes')}>
          Danh sách
        </Button>
      </header>
      <section className="merchant-list-card">
        <Descriptions
          bordered
          column={1}
          items={[
            { key: 'booking', label: 'Booking', children: item.bookingCode || `Booking #${item.bookingId}` },
            { key: 'lot', label: 'Bãi đỗ', children: item.parkingLotName || '—' },
            { key: 'driver', label: 'Tài xế', children: item.driverPhone || '—' },
            { key: 'reason', label: 'Lý do', children: item.reason },
            { key: 'description', label: 'Mô tả', children: item.description || '—' },
            { key: 'created', label: 'Ngày tạo', children: formatOptionalDate(item.createdAt) },
            { key: 'updated', label: 'Cập nhật', children: formatOptionalDate(item.updatedAt) },
            { key: 'resolution', label: 'Kết quả xử lý', children: item.resolution || 'Chưa có' },
          ]}
        />
        {item.resolution && (
          <Alert className="merchant-inline-alert" type="success" showIcon message="Đã có kết quả xử lý" description={item.resolution} />
        )}
      </section>
    </main>
  )
}

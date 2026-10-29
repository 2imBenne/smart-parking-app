import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantDisputes } from '../api/merchantDisputeApi'
import type { MerchantDispute, MerchantDisputePage, MerchantDisputeStatus } from '../types/merchantDisputeTypes'

const statusMeta: Record<MerchantDisputeStatus, { label: string; color: string }> = {
  PENDING: { label: 'Cho xu ly', color: 'gold' },
  REVIEWING: { label: 'Dang xem xet', color: 'blue' },
  RESOLVED: { label: 'Da giai quyet', color: 'green' },
  REJECTED: { label: 'Da tu choi', color: 'red' },
}

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

export function MerchantDisputesPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MerchantDisputePage>({ content: [], currentPage: 0, totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState<MerchantDisputeStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const result = await getMerchantDisputes({ page, size })
      setData(result)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setData((current) => ({ ...current, content: [] }))
    } finally {
      setLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(loadTimer)
  }, [load])

  const visible = useMemo(() => {
    if (status === 'ALL') return data.content
    return data.content.filter((item) => item.status === status)
  }, [data.content, status])

  const columns: TableColumnsType<MerchantDispute> = [
    { title: 'Ma tranh chap', dataIndex: 'id', key: 'id', width: 135, render: (id: number) => <strong>DSP-{id}</strong> },
    { title: 'Booking', dataIndex: 'bookingCode', key: 'bookingCode', width: 155, render: (code: string, item) => code || `Booking #${item.bookingId}` },
    { title: 'Nguoi tao', key: 'creator', width: 160, render: (_, item) => item.driverPhone || '—' },
    { title: 'Ly do', dataIndex: 'reason', key: 'reason', render: (reason: string, item) => <span title={item.description ?? undefined}>{reason}</span> },
    { title: 'Trang thai', dataIndex: 'status', key: 'status', width: 145, render: (value: MerchantDisputeStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag> },
    { title: 'Ngay tao', dataIndex: 'createdAt', key: 'createdAt', width: 150, responsive: ['lg'], render: (value?: string | null) => formatOptionalDate(value) },
    { title: 'Cap nhat', dataIndex: 'updatedAt', key: 'updatedAt', width: 150, responsive: ['lg'], render: (value?: string | null) => formatOptionalDate(value) },
    { title: 'Bai do', dataIndex: 'parkingLotName', key: 'parkingLotName', width: 160, responsive: ['md'], render: (value?: string | null) => value || '—' },
    { title: '', key: 'action', width: 110, render: (_, item) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/merchant/disputes/${item.id}`)}>Chi tiet</Button> },
  ]

  return <main className="merchant-page-stack">
    <header className="merchant-page-header"><div><h1>Tranh chap</h1><p>Theo doi cac khieu nai lien quan den booking tai bai do cua ban.</p></div></header>
    {error && <Alert type="error" showIcon message="Khong tai duoc danh sach tranh chap" description={error} action={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Thu lai</Button>} />}
    <section className="merchant-list-card">
      <div className="merchant-filter-card">
        <Select value={status} options={[{ value: 'ALL', label: 'Tat ca trang thai' }, ...statusOptions]} onChange={(value) => setStatus(value)} />
        <span>{visible.length} / {data.totalElements} tranh chap</span>
      </div>
      <Table<MerchantDispute>
        rowKey="id"
        columns={columns}
        dataSource={visible}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data.totalElements,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `${total} tranh chap`,
          onChange: (nextPage, nextSize) => { setPage(nextSize !== size ? 0 : nextPage - 1); setSize(nextSize) },
        }}
        locale={{ emptyText: <Empty description={status === 'ALL' ? 'Chua co tranh chap nao' : 'Khong co tranh chap phu hop trang thai'} /> }}
        scroll={{ x: 1080 }}
      />
    </section>
  </main>
}

function formatOptionalDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

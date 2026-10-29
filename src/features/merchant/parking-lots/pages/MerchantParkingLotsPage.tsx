import { EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantParkingLots } from '../api/merchantParkingLotApi'
import type { MerchantParkingLotListItem, MerchantParkingLotPage, ParkingLotStatus } from '../types/merchantParkingLotTypes'

const statusMeta: Record<ParkingLotStatus, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', color: 'gold' },
  CHANGES_REQUESTED: { label: 'Cần bổ sung', color: 'purple' },
  APPROVED: { label: 'Đã phê duyệt', color: 'green' },
  REJECTED: { label: 'Bị từ chối', color: 'red' },
  SUSPENDED: { label: 'Tạm ngưng', color: 'default' },
}

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))
const sortOptions = [
  { value: 'createdAt,desc', label: 'Mới tạo gần đây' },
  { value: 'createdAt,asc', label: 'Cũ nhất trước' },
  { value: 'name,asc', label: 'Tên A–Z' },
  { value: 'name,desc', label: 'Tên Z–A' },
]

export function MerchantParkingLotsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MerchantParkingLotPage>({ content: [], currentPage: 0, totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState<ParkingLotStatus>()
  const [sort, setSort] = useState('createdAt,desc')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const result = await getMerchantParkingLots({
        page,
        size,
        status,
        keyword: keyword || undefined,
        sort,
      })
      setData(result)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setData((current) => ({ ...current, content: [] }))
    } finally {
      setLoading(false)
    }
  }, [keyword, page, size, sort, status])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(loadTimer)
  }, [load])

  const search = () => {
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  const columns: TableColumnsType<MerchantParkingLotListItem> = [
    { title: 'Tên bãi', dataIndex: 'name', key: 'name', render: (name: string) => <strong>{name}</strong> },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', responsive: ['md'] },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 155, render: (value: ParkingLotStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag> },
    { title: 'Đánh giá', dataIndex: 'ratingAverage', key: 'ratingAverage', width: 100, responsive: ['lg'], render: (value: number | null) => value == null ? 'Chưa có' : `${value.toFixed(1)}/5` },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 155, responsive: ['lg'], render: (value: string) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—' },
    { title: '', key: 'action', width: 110, render: (_, lot) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/merchant/parking-lots/${lot.id}`)}>Chi tiết</Button> },
  ]

  return <main className="merchant-page-stack">
    <header className="merchant-page-header"><div><h1>Bãi đỗ của tôi</h1><p>Quản lý hồ sơ, sức chứa và bảng giá của các bãi thuộc quyền sở hữu.</p></div><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/merchant/parking-lots/new')}>Tạo bãi mới</Button></header>
    {error && <Alert type="error" showIcon message="Không tải được danh sách bãi đỗ" description={error} action={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Thử lại</Button>} />}
    <section className="merchant-list-card">
      <div className="merchant-filter-bar">
        <Input value={keywordInput} prefix={<SearchOutlined />} allowClear placeholder="Tìm theo tên hoặc địa chỉ" onChange={(event) => setKeywordInput(event.target.value)} onPressEnter={search} addonAfter={<Button type="text" onClick={search}>Tìm</Button>} />
        <Select allowClear value={status} placeholder="Tất cả trạng thái" options={statusOptions} onChange={(value) => { setPage(0); setStatus(value) }} />
        <Select value={sort} options={sortOptions} onChange={(value) => { setPage(0); setSort(value) }} />
      </div>
      <Table<MerchantParkingLotListItem>
        rowKey="id"
        columns={columns}
        dataSource={data.content}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data.totalElements,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (total) => `${total} bãi đỗ`,
          onChange: (nextPage, nextSize) => { setPage(nextSize !== size ? 0 : nextPage - 1); setSize(nextSize) },
        }}
        locale={{ emptyText: <Empty description={keyword || status ? 'Không có bãi đỗ phù hợp bộ lọc' : 'Bạn chưa tạo bãi đỗ nào'} /> }}
        scroll={{ x: 760 }}
      />
    </section>
  </main>
}

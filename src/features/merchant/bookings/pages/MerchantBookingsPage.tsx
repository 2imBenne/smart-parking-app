import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import type { BookingDto, BookingStatus } from '../../../bookings/types/bookingTypes'
import { VEHICLE_TYPE_LABELS } from '../../../vehicles/types/vehicleTypes'
import { getMerchantBookings, type MerchantBookingPage } from '../api/merchantBookingApi'
import { getMerchantParkingLots } from '../../parking-lots/api/merchantParkingLotApi'

const statusMeta: Record<BookingStatus, { label: string; color: string }> = {
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

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))

export function MerchantBookingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialLotId = searchParams.get('parkingLotId') ? Number(searchParams.get('parkingLotId')) : 'ALL'

  const [data, setData] = useState<MerchantBookingPage>({ content: [], currentPage: 0, totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL')
  const [selectedLotId, setSelectedLotId] = useState<number | 'ALL'>(initialLotId)
  const [parkingLots, setParkingLots] = useState<Array<{ id: number; name: string }>>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    void getMerchantParkingLots({ page: 0, size: 100, sort: 'name,asc' })
      .then((res) => {
        setParkingLots(res.content.map((lot) => ({ id: lot.id, name: lot.name })))
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const lotParam = selectedLotId === 'ALL' ? undefined : selectedLotId
      setData(await getMerchantBookings(page, size, lotParam))
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setData((current) => ({ ...current, content: [] }))
    } finally {
      setLoading(false)
    }
  }, [page, size, selectedLotId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const visible = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi')
    return data.content.filter((item) => {
      if (selectedLotId !== 'ALL' && Number(item.parkingLotId) !== Number(selectedLotId)) return false
      if (status !== 'ALL' && item.status !== status) return false
      if (!query) return true
      return `${item.bookingCode} ${item.driverName} ${item.driverPhone ?? ''} ${item.vehicleLicensePlate} ${item.parkingLotName}`
        .toLocaleLowerCase('vi')
        .includes(query)
    })
  }, [data.content, keyword, status, selectedLotId])

  const columns: TableColumnsType<BookingDto> = [
    {
      title: 'Mã booking',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      width: 180,
      render: (code: string) => <strong>{code.slice(0, 8)}…</strong>,
    },
    { title: 'Bãi đỗ', dataIndex: 'parkingLotName', key: 'parkingLotName' },
    { title: 'Tài xế', dataIndex: 'driverName', key: 'driverName', width: 140, responsive: ['md'] },
    {
      title: 'SĐT',
      dataIndex: 'driverPhone',
      key: 'driverPhone',
      width: 130,
      render: (phone?: string | null) => phone || '—',
    },
    {
      title: 'Xe',
      key: 'vehicle',
      width: 160,
      render: (_, item) => (
        <span>
          <strong>{item.vehicleLicensePlate}</strong>
          <br />
          <small>{VEHICLE_TYPE_LABELS[item.vehicleType]}</small>
        </span>
      ),
    },
    {
      title: 'Check-in dự kiến',
      dataIndex: 'expectedCheckInTime',
      key: 'expectedCheckInTime',
      width: 160,
      responsive: ['lg'],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: BookingStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag>,
    },
    {
      title: 'Cọc',
      dataIndex: 'advanceDeposit',
      key: 'advanceDeposit',
      width: 120,
      responsive: ['md'],
      render: (value: number) => formatMoney(value),
    },
    {
      title: '',
      key: 'action',
      width: 110,
      render: (_, item) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/merchant/bookings/${item.id}`)}>
          Chi tiết
        </Button>
      ),
    },
  ]

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Booking</h1>
          <p>Theo dõi đơn đặt chỗ tại các bãi đỗ của bạn.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </header>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách booking"
          description={error}
          action={<Button onClick={() => void load()}>Thử lại</Button>}
        />
      )}

      <section className="merchant-list-card">
        <div className="merchant-filter-bar">
          <Select
            style={{ minWidth: 240 }}
            value={selectedLotId}
            options={[
              { value: 'ALL', label: 'Tất cả bãi đỗ' },
              ...parkingLots.map((lot) => ({ value: lot.id, label: `Bãi #${lot.id} - ${lot.name}` })),
            ]}
            onChange={(value) => {
              setSelectedLotId(value)
              setPage(0)
              if (value === 'ALL') {
                searchParams.delete('parkingLotId')
              } else {
                searchParams.set('parkingLotId', String(value))
              }
              setSearchParams(searchParams, { replace: true })
            }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm mã, tài xế, biển số, bãi"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            value={status}
            options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, ...statusOptions]}
            onChange={(value) => setStatus(value)}
          />
        </div>
        <p style={{ margin: '12px 0' }}>
          {visible.length} / {data.totalElements} booking
        </p>
        <Table<BookingDto>
          rowKey="id"
          columns={columns}
          dataSource={visible}
          loading={loading}
          locale={{ emptyText: <Empty description="Chưa có booking nào" /> }}
          pagination={{
            current: page + 1,
            pageSize: size,
            total: data.totalElements,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage - 1)
              setSize(nextSize)
            },
          }}
        />
      </section>
    </main>
  )
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0)
}

import { Search, X } from 'lucide-react'
import { Skeleton, Table, Tag } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMyPayments, type PaymentDto } from '../api/paymentApi'

export function DriverPaymentsPage() {
  const [items, setItems] = useState<PaymentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<PaymentDto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyPayments()
      setItems(data.content)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    return items.filter((item) => {
      const matchFilter = filter === 'ALL' ? true : item.status === filter
      const bookingCodeStr = item.bookingCode || (item.bookingId ? `BK-${item.bookingId}` : '')
      const txnCodeStr = item.transactionCode || ''
      const matchSearch =
        bookingCodeStr.toLowerCase().includes(search.toLowerCase()) ||
        txnCodeStr.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [filter, search, items])

  const total = items
    .filter((item) => item.status === 'SUCCESS')
    .reduce((sum, item) => sum + item.amount, 0)

  return (
    <main className="driver-feature-page stitch-section">
      <header className="driver-page-heading">
        <div>
          <span>LỊCH SỬ GIAO DỊCH</span>
          <h1>Thanh toán & hóa đơn</h1>
          <p>Theo dõi tiền cọc, thanh toán cuối cùng và phí quá giờ.</p>
        </div>
        <article className="payment-total">
          <small>Tổng đã thanh toán</small>
          <strong>{formatMoney(total)}</strong>
        </article>
      </header>

      <div className="payment-filters">
        <label>
          <Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã giao dịch, booking"
          />
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="FAILED">Thất bại</option>
        </select>
        <span>{visible.length} giao dịch</span>
      </div>

      {loading ? (
        <Skeleton active />
      ) : (
        <Table
          columns={[
            {
              title: 'Thời gian',
              key: 'time',
              render: (_: unknown, row: PaymentDto) => (
                <time dateTime={toIsoHint(row.paidAt ?? row.createdAt)}>
                  {formatDateTime(row.paidAt ?? row.createdAt)}
                </time>
              ),
            },
            {
              title: 'Mã Booking',
              dataIndex: 'bookingCode',
              key: 'bookingCode',
              render: (code: string, row: PaymentDto) => <strong>{code || (row.bookingId ? `BK-${row.bookingId}` : '—')}</strong>,
            },
            {
              title: 'Mã Giao dịch',
              dataIndex: 'transactionCode',
              key: 'transactionCode',
              render: (tx: string) => <span className="transaction-code">{tx || 'N/A'}</span>,
            },
            {
              title: 'Số tiền',
              dataIndex: 'amount',
              key: 'amount',
              align: 'right' as const,
              render: (val: number) => (
                <strong className="amount-col">
                  {new Intl.NumberFormat('vi-VN').format(val)} đ
                </strong>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const mapping: Record<string, { label: string; color: string }> = {
                  SUCCESS: { label: 'Thành công', color: 'green' },
                  PENDING: { label: 'Chờ xử lý', color: 'orange' },
                  FAILED: { label: 'Thất bại', color: 'red' },
                  REFUNDED: { label: 'Đã hoàn tiền', color: 'gray' },
                }
                const info = mapping[status] || { label: status, color: 'default' }
                return <Tag color={info.color}>{info.label}</Tag>
              },
            },
          ]}
          dataSource={visible}
          onRow={(row) => ({
            onClick: () => setSelected(row),
            style: { cursor: 'pointer' },
          })}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      {selected && (
        <div
          className="payment-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-detail-title"
        >
          <article>
            <header>
              <div>
                <small>CHI TIẾT GIAO DỊCH</small>
                <h2 id="payment-detail-title">{selected.transactionCode}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Đóng">
                <X />
              </button>
            </header>
            <dl>
              <div>
                <dt>Booking</dt>
                <dd>{selected.bookingCode || (selected.bookingId ? `BK-${selected.bookingId}` : '—')}</dd>
              </div>
              <div>
                <dt>Thời gian</dt>
                <dd>{formatDateTime(selected.paidAt ?? selected.createdAt)}</dd>
              </div>
              <div className="total">
                <dt>Số tiền</dt>
                <dd>{formatMoney(selected.amount)}</dd>
              </div>
            </dl>
          </article>
        </div>
      )}
    </main>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`
}

/** Chấp nhận ISO string hoặc mảng LocalDateTime Jackson `[y,m,d,h,mi,s]`. */
function parseDate(value?: string | number[] | null): Date | null {
  if (value == null || value === '') return null
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = value
    if (y == null || m == null || d == null) return null
    const date = new Date(y, m - 1, d, h, mi, Math.floor(Number(s)))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const raw = String(value).trim()
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateTime(value?: string | number[] | null): string {
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toIsoHint(value?: string | number[] | null): string | undefined {
  const date = parseDate(value)
  return date ? date.toISOString() : undefined
}

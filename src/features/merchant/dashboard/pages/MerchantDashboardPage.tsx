import { BarChart3, CalendarCheck, CircleDollarSign, CircleParking, MessageSquare, TrendingUp } from 'lucide-react'
import { Alert, Empty, Skeleton, Tag } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from 'recharts'
import { getMerchantRevenue, type MerchantRevenue } from '../../../dashboard/api/merchantDashboardApi'
import { getUnreadCount } from '../../../notifications/api/notificationApi'
import { getMerchantBookings } from '../../bookings/api/merchantBookingApi'
import type { BookingDto, BookingStatus } from '../../../bookings/types/bookingTypes'
import { extractApiError } from '../../../../shared/api/errors'

const statusLabels: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CHECKIN: 'Chờ check-in',
  PARKING: 'Đang đỗ',
  OVERTIME: 'Quá giờ',
  AWAITING_FINAL_PAYMENT: 'Chờ thanh toán cuối',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  REVIEWED: 'Đã đánh giá',
}

export function MerchantDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MerchantRevenue | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingDto[]>([])
  const [unread, setUnread] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [revenue, bookings, unreadCount] = await Promise.all([
        getMerchantRevenue(undefined, undefined, 'DAY'),
        getMerchantBookings(0, 5),
        getUnreadCount().catch(() => null),
      ])
      setData(revenue)
      setRecentBookings(bookings.content)
      setUnread(unreadCount)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [])

  const weekChart = useMemo(() => {
    const series = data?.series ?? []
    const last7 = series.slice(-7)
    return last7.map((point) => {
      const [, m, d] = point.period.split('-')
      return {
        label: `${d}/${m}`,
        revenue: Number(point.revenue ?? 0),
      }
    })
  }, [data?.series])

  const hasWeekChart = weekChart.some((point) => point.revenue > 0)

  return (
    <main className="merchant-dashboard">
      <div className="merchant-title">
        <div>
          <span>TỔNG QUAN VẬN HÀNH</span>
          <h1>Chào mừng trở lại</h1>
          <p>Theo dõi hiệu quả kinh doanh bãi đỗ trong một màn hình.</p>
        </div>
        <button onClick={() => navigate('/merchant/parking-lots/new')}>+ Thêm bãi đỗ</button>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải tổng quan Merchant"
          description={error}
          action={
            <button className="dashboard-retry" onClick={() => void load()}>
              Tải lại
            </button>
          }
        />
      )}
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <section className="merchant-metrics">
            <Metric
              icon={<CircleDollarSign />}
              label="Tổng doanh thu"
              value={formatMoney(data?.totalRevenue ?? 0)}
              note={data?.walletBalance != null ? `Số dư ví: ${formatMoney(data.walletBalance)}` : 'Dữ liệu từ giao dịch hoàn tất'}
              tone="green"
            />
            <Metric
              icon={<CircleParking />}
              label="Tỷ lệ lấp đầy"
              value="—"
              note="Chưa có thống kê occupancy từ Backend"
              tone="orange"
            />
            <Metric
              icon={<CalendarCheck />}
              label="Đơn hoàn thành"
              value={String(data?.completedBookings ?? 0)}
              note="Tổng booking đã hoàn tất"
              tone="blue"
            />
            <Metric
              icon={<MessageSquare />}
              label="Thông báo mới"
              value={unread == null ? '—' : String(unread)}
              note={unread == null ? 'Không đọc được unread-count' : 'Chưa đọc'}
              tone="purple"
            />
          </section>
          <section className="merchant-dashboard-grid">
            <article className="merchant-chart-card">
              <header>
                <div>
                  <h2>Xu hướng doanh thu</h2>
                  <p>7 ngày gần nhất · dữ liệu payment SUCCESS</p>
                </div>
                <Link to="/merchant/revenue">Xem theo ngày/tháng/năm</Link>
              </header>
              {!hasWeekChart ? (
                <div className="merchant-empty-chart">
                  <BarChart3 />
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có doanh thu 7 ngày gần nhất" />
                </div>
              ) : (
                <div className="merchant-dashboard-chart">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weekChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
                      <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(Number(value))
                        }
                        tick={{ fill: '#667085', fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            maximumFractionDigits: 0,
                          }).format(Number(value)),
                          'Doanh thu',
                        ]}
                      />
                      <Bar dataKey="revenue" fill="#e08a00" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
            <article className="merchant-booking-card">
              <header>
                <h2>Đơn đặt chỗ gần đây</h2>
                <Link to="/merchant/bookings">Xem tất cả</Link>
              </header>
              {recentBookings.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có booking" />
              ) : (
                <ul className="merchant-recent-bookings">
                  {recentBookings.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => navigate(`/merchant/bookings/${item.id}`)}>
                        <span>
                          <strong>{item.parkingLotName}</strong>
                          <small>
                            {item.vehicleLicensePlate} · {item.driverName || 'Tài xế'}
                          </small>
                        </span>
                        <Tag>{statusLabels[item.status]}</Tag>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  )
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: string }) {
  return (
    <article className="merchant-metric">
      <span className={`metric-icon ${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      {tone === 'green' && <TrendingUp className="metric-trend" />}
    </article>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

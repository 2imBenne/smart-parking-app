import { CalendarOutlined, CheckCircleOutlined, DollarOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons'
import { Alert, Button, DatePicker, Empty, Segmented, Skeleton, Statistic } from 'antd'
import type { Dayjs } from 'dayjs'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getMerchantRevenue,
  type MerchantRevenue,
  type RevenueGranularity,
} from '../../../dashboard/api/merchantDashboardApi'
import { extractApiError } from '../../../../shared/api/errors'

type PickerMode = 'date' | 'month' | 'year'

const granularityOptions: { label: string; value: RevenueGranularity }[] = [
  { label: 'Theo ngày', value: 'DAY' },
  { label: 'Theo tháng', value: 'MONTH' },
  { label: 'Theo năm', value: 'YEAR' },
]

function pickerModeOf(granularity: RevenueGranularity): PickerMode {
  if (granularity === 'MONTH') return 'month'
  if (granularity === 'YEAR') return 'year'
  return 'date'
}

function toApiRange(
  granularity: RevenueGranularity,
  dates: [Dayjs, Dayjs] | null,
): [string, string] | null {
  if (!dates?.[0] || !dates[1]) return null
  const [start, end] = dates
  if (granularity === 'YEAR') {
    return [
      start.startOf('year').format('YYYY-MM-DDTHH:mm:ss'),
      end.endOf('year').format('YYYY-MM-DDTHH:mm:ss'),
    ]
  }
  if (granularity === 'MONTH') {
    return [
      start.startOf('month').format('YYYY-MM-DDTHH:mm:ss'),
      end.endOf('month').format('YYYY-MM-DDTHH:mm:ss'),
    ]
  }
  return [
    start.startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    end.endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
  ]
}

function formatPeriodLabel(period: string, granularity: RevenueGranularity) {
  if (granularity === 'YEAR') return period
  if (granularity === 'MONTH') {
    const [y, m] = period.split('-')
    return `Thg ${Number(m)}/${y}`
  }
  const [y, m, d] = period.split('-')
  return `${d}/${m}/${y}`
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MerchantRevenuePage() {
  const [data, setData] = useState<MerchantRevenue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [granularity, setGranularity] = useState<RevenueGranularity>('DAY')
  const [pickerValue, setPickerValue] = useState<[Dayjs, Dayjs] | null>(null)

  const load = useCallback(
    async (nextGranularity = granularity, nextPicker = pickerValue) => {
      setLoading(true)
      setError('')
      try {
        const range = toApiRange(nextGranularity, nextPicker)
        setData(await getMerchantRevenue(range?.[0], range?.[1], nextGranularity))
      } catch (requestError) {
        setError(extractApiError(requestError as AxiosError))
      } finally {
        setLoading(false)
      }
    },
    [granularity, pickerValue],
  )

  useEffect(() => {
    void load('DAY', null)
  }, [])

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        ...point,
        label: formatPeriodLabel(point.period, granularity),
        revenue: Number(point.revenue ?? 0),
      })),
    [data?.series, granularity],
  )

  const hasChartData = chartData.some((point) => point.revenue !== 0 || point.bookingCount > 0)

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Doanh thu</h1>
          <p>Theo dõi doanh thu theo ngày, tháng, năm từ giao dịch thanh toán thành công.</p>
        </div>
        <Link className="merchant-link-button" to="/merchant/withdrawals">
          <WalletOutlined /> Yêu cầu rút tiền
        </Link>
      </header>

      <section className="merchant-filter-card merchant-revenue-filters">
        <Segmented
          options={granularityOptions}
          value={granularity}
          onChange={(value) => {
            const next = value as RevenueGranularity
            setGranularity(next)
            setPickerValue(null)
            void load(next, null)
          }}
        />
        <div className="merchant-revenue-filter-actions">
          <DatePicker.RangePicker
            picker={pickerModeOf(granularity)}
            value={pickerValue}
            onChange={(dates) => {
              const next =
                dates?.[0] && dates[1] ? ([dates[0], dates[1]] as [Dayjs, Dayjs]) : null
              setPickerValue(next)
            }}
            placeholder={
              granularity === 'YEAR'
                ? ['Từ năm', 'Đến năm']
                : granularity === 'MONTH'
                  ? ['Từ tháng', 'Đến tháng']
                  : ['Từ ngày', 'Đến ngày']
            }
          />
          <Button type="primary" icon={<CalendarOutlined />} onClick={() => void load()}>
            Áp dụng
          </Button>
          <Button
            onClick={() => {
              setPickerValue(null)
              void load(granularity, null)
            }}
          >
            Mặc định
          </Button>
        </div>
        <p className="merchant-revenue-filter-hint">
          {pickerValue
            ? 'Đang lọc theo khoảng đã chọn.'
            : granularity === 'DAY'
              ? 'Mặc định: 30 ngày gần nhất.'
              : granularity === 'MONTH'
                ? 'Mặc định: 12 tháng gần nhất.'
                : 'Mặc định: 5 năm gần nhất.'}
        </p>
      </section>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải doanh thu"
          description={error}
          action={
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              Thử lại
            </Button>
          }
        />
      )}

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : data ? (
        <>
          <section className="merchant-revenue-kpis">
            <article>
              <Statistic
                title="Tổng doanh thu (gross)"
                value={data.totalRevenue}
                prefix={<DollarOutlined />}
                formatter={(value) => formatMoney(Number(value))}
              />
            </article>
            <article>
              <Statistic
                title="Booking hoàn thành"
                value={data.completedBookings}
                prefix={<CheckCircleOutlined />}
              />
            </article>
            <article>
              <Statistic
                title="Số dư ví (net)"
                value={data.walletBalance ?? 0}
                prefix={<WalletOutlined />}
                formatter={(value) => formatMoney(Number(value))}
              />
            </article>
            <article>
              <Statistic
                title={`Phí nền tảng đã trừ${data.platformFeePercent != null ? ` (${data.platformFeePercent}%)` : ''}`}
                value={data.totalPlatformFee ?? 0}
                prefix={<DollarOutlined />}
                formatter={(value) => formatMoney(Number(value))}
              />
            </article>
          </section>
          {(data.platformFeePercent != null || data.minWithdrawalAmount != null) && (
            <Alert
              type="info"
              showIcon
              message="Chính sách tài chính"
              description={`Phí hệ thống ${data.platformFeePercent ?? 0}% trên mỗi khoản đã thu trước khi cộng ví. Rút tối thiểu ${formatMoney(data.minWithdrawalAmount ?? 0)}.`}
            />
          )}

          <section className="merchant-detail-card merchant-revenue-chart-card">
            <header className="merchant-revenue-chart-header">
              <div>
                <h2>Biểu đồ doanh thu</h2>
                <p>
                  {granularity === 'DAY'
                    ? 'Doanh thu theo từng ngày'
                    : granularity === 'MONTH'
                      ? 'Doanh thu theo từng tháng'
                      : 'Doanh thu theo từng năm'}
                </p>
              </div>
              <span>{chartData.length} kỳ</span>
            </header>
            {!hasChartData ? (
              <Empty description="Chưa có giao dịch SUCCESS trong khoảng đang xem" />
            ) : (
              <div className="merchant-revenue-chart">
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
                    <XAxis dataKey="label" tick={{ fill: '#667085', fontSize: 12 }} />
                    <YAxis
                      yAxisId="revenue"
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('vi-VN', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(Number(value))
                      }
                      tick={{ fill: '#667085', fontSize: 12 }}
                    />
                    <YAxis yAxisId="bookings" orientation="right" allowDecimals={false} tick={{ fill: '#667085', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Doanh thu') return [formatMoney(Number(value)), name]
                        return [value, 'Booking']
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="revenue" name="Doanh thu" fill="#e08a00" radius={[6, 6, 0, 0]} maxBarSize={42} />
                    <Line
                      yAxisId="bookings"
                      type="monotone"
                      dataKey="bookingCount"
                      name="Booking"
                      stroke="#002f49"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      ) : (
        <Empty description="Chưa có dữ liệu doanh thu" />
      )}

      <Alert
        type="info"
        showIcon
        message="Ghi chú"
        description="Doanh thu tính từ payment SUCCESS (cọc/final trừ refund). Số dư ví cập nhật khi check-out / webhook ghi nhận tiền đã thu."
      />
    </main>
  )
}

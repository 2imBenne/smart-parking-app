import { ArrowRight, BarChart3, CalendarCheck, CarFront, CircleDollarSign, CircleParking, Clock3, MapPin, MessageSquare, Search, TrendingUp, UserRound } from 'lucide-react'
import { Alert, Empty, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { extractApiError } from '../../../shared/api/errors'
import { getAuthSession } from '../../../shared/auth/session'
import { getMerchantRevenue, type MerchantRevenue } from '../api/merchantDashboardApi'
import { getMyVehicles } from '../../vehicles/api/vehicleApi'
import { getMyBookings } from '../../bookings/api/bookingApi'
import type { BookingDto, BookingStatus } from '../../bookings/types/bookingTypes'

export function DashboardHomePage() {
  const role = getAuthSession()?.role
  if (role === 'MERCHANT') return <MerchantDashboard />
  if (role === 'DRIVER') return <DriverDashboard />
  return <RoleWelcome role={role ?? 'ADMIN'} />
}

const activeStatuses: BookingStatus[] = ['PENDING_PAYMENT', 'PENDING_CHECKIN', 'PARKING', 'OVERTIME', 'AWAITING_FINAL_PAYMENT']
const statusLabels: Record<BookingStatus, string> = { PENDING_PAYMENT: 'Chờ thanh toán', PENDING_CHECKIN: 'Chờ check-in', PARKING: 'Đang đỗ xe', OVERTIME: 'Quá giờ', AWAITING_FINAL_PAYMENT: 'Chờ thanh toán cuối', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', REVIEWED: 'Đã đánh giá' }

function DriverDashboard() {
  const session = getAuthSession()
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [bookingTotal, setBookingTotal] = useState(0)
  const [vehicleTotal, setVehicleTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const [vehiclePage, bookingPage] = await Promise.all([getMyVehicles(0, 1), getMyBookings(0, 20)])
      setVehicleTotal(vehiclePage.totalElements); setBookingTotal(bookingPage.totalElements); setBookings(bookingPage.content)
    } catch (requestError) { setError(extractApiError(requestError as AxiosError)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void Promise.resolve().then(load) }, [])

  const activeCount = bookings.filter(item => activeStatuses.includes(item.status)).length
  const recent = [...bookings].sort((a, b) => new Date(b.expectedCheckInTime).getTime() - new Date(a.expectedCheckInTime).getTime())[0]

  return <main className="driver-home">
    <section className="driver-welcome"><div><span>TỔNG QUAN TÀI XẾ</span><h1>Xin chào, {session?.phone}</h1><p>Quản lý hành trình và tìm chỗ đỗ phù hợp cho phương tiện của bạn.</p></div><Link to="/parking"><Search /> Tìm bãi đỗ <ArrowRight /></Link></section>
    {error && <Alert type="error" showIcon message="Không thể tải dữ liệu tổng quan" description={error} action={<button className="dashboard-retry" onClick={() => void load()}>Tải lại</button>} />}
    {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : <>
      <section className="driver-stats"><DriverStat icon={<CarFront />} value={vehicleTotal} label="Phương tiện" link="/vehicles" tone="blue" /><DriverStat icon={<CalendarCheck />} value={bookingTotal} label="Tổng lượt đặt chỗ" link="/bookings" tone="orange" /><DriverStat icon={<Clock3 />} value={activeCount} label="Chuyến đang hoạt động" link="/bookings" tone="green" /></section>
      <section className="driver-home-grid"><article className="driver-recent"><header><div><span>HOẠT ĐỘNG GẦN ĐÂY</span><h2>Chuyến gần nhất</h2></div><Link to="/bookings">Xem tất cả <ArrowRight /></Link></header>{recent ? <div className="recent-booking"><div className="recent-lot-icon"><CircleParking /></div><div className="recent-main"><span className={`driver-status ${recent.status.toLowerCase()}`}>{statusLabels[recent.status]}</span><h3>{recent.parkingLotName}</h3><p><MapPin /> {recent.parkingLotAddress}</p></div><div className="recent-meta"><small>PHƯƠNG TIỆN</small><strong>{recent.vehicleLicensePlate}</strong><small>THỜI GIAN DỰ KIẾN</small><strong>{formatDateTime(recent.expectedCheckInTime)}</strong></div></div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>Bạn chưa có chuyến nào. <Link to="/parking">Tìm bãi đỗ ngay</Link></span>} />}</article>
      <article className="driver-shortcuts"><header><span>TRUY CẬP NHANH</span><h2>Bạn muốn làm gì?</h2></header><Shortcut icon={<Search />} title="Tìm bãi đỗ" text="Xem chỗ trống và bảng giá" to="/parking" /><Shortcut icon={<CarFront />} title="Quản lý phương tiện" text="Thêm hoặc cập nhật xe" to="/vehicles" /><Shortcut icon={<CalendarCheck />} title="Đặt chỗ của tôi" text="Theo dõi booking và QR" to="/bookings" /><Shortcut icon={<UserRound />} title="Thông tin cá nhân" text="Xem tài khoản và bảo mật" to="/profile" /></article></section>
    </>}
  </main>
}

function DriverStat({ icon, value, label, link, tone }: { icon: ReactNode; value: number; label: string; link: string; tone: string }) { return <Link to={link} className="driver-stat"><span className={tone}>{icon}</span><div><strong>{value}</strong><p>{label}</p></div><ArrowRight /></Link> }
function Shortcut({ icon, title, text, to }: { icon: ReactNode; title: string; text: string; to: string }) { return <Link to={to} className="driver-shortcut"><span>{icon}</span><div><strong>{title}</strong><p>{text}</p></div><ArrowRight /></Link> }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }

function MerchantDashboard() {
  const [data, setData] = useState<MerchantRevenue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getMerchantRevenue().then(setData).catch((error: AxiosError) => message.error(extractApiError(error))).finally(() => setLoading(false))
  }, [])

  return <main className="merchant-dashboard">
    <div className="merchant-title"><div><span>TỔNG QUAN VẬN HÀNH</span><h1>Chào mừng trở lại</h1><p>Theo dõi hiệu quả kinh doanh bãi đỗ trong một màn hình.</p></div><button onClick={() => message.info('Trang tạo bãi đỗ sẽ được hoàn thiện ở màn hình quản lý bãi')}>+ Thêm bãi đỗ</button></div>
    {loading ? <Skeleton active /> : <>
      <section className="merchant-metrics">
        <Metric icon={<CircleDollarSign />} label="Tổng doanh thu" value={formatMoney(data?.totalRevenue ?? 0)} note="Dữ liệu từ giao dịch hoàn tất" tone="green" />
        <Metric icon={<CircleParking />} label="Tỷ lệ lấp đầy" value="—" note="Backend chưa cung cấp thống kê" tone="orange" />
        <Metric icon={<CalendarCheck />} label="Đơn hoàn thành" value={String(data?.completedBookings ?? 0)} note="Tổng booking đã hoàn tất" tone="blue" />
        <Metric icon={<MessageSquare />} label="Tin nhắn mới" value="—" note="Chưa có module tin nhắn" tone="purple" />
      </section>
      <section className="merchant-dashboard-grid">
        <article className="merchant-chart-card"><header><div><h2>Xu hướng doanh thu</h2><p>Cần API doanh thu theo ngày để hiển thị biểu đồ chính xác</p></div><span>7 ngày gần nhất</span></header><div className="merchant-empty-chart"><BarChart3 /><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu theo ngày" /></div></article>
        <article className="merchant-booking-card"><header><h2>Đơn đặt chỗ gần đây</h2></header><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Backend chưa có API danh sách booking cho chủ bãi" /></article>
      </section>
    </>}
  </main>
}

function Metric({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: string }) { return <article className="merchant-metric"><span className={`metric-icon ${tone}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>{tone === 'green' && <TrendingUp className="metric-trend" />}</article> }
function formatMoney(value: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value) }

function RoleWelcome({ role }: { role: string }) { return <main className="role-welcome"><span>{role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'TÀI XẾ'}</span><h1>Bảng điều khiển SmartTruck</h1><p>{role === 'ADMIN' ? 'Quản lý người dùng, phê duyệt bãi đỗ và theo dõi nhật ký hệ thống.' : 'Quản lý phương tiện, tìm bãi đỗ và theo dõi các chuyến đã đặt.'}</p></main> }

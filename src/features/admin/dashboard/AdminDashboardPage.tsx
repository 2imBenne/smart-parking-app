import { CircleDollarSign, CircleParking, Clock3, Truck, Users, Warehouse } from 'lucide-react'
import { Alert, Skeleton, message } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { formatAdminMoney } from '../shared/adminFormat'
import type { AdminDashboardSummary } from '../types/adminTypes'

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    void adminRepository.dashboard()
      .then(data => { if (active) setSummary(data) })
      .catch(error => {
        if (!active) return
        setFailed(true)
        message.error(error instanceof Error ? error.message : 'Không thể tải tổng quan Admin')
      })
    return () => { active = false }
  }, [])

  if (failed) return <Alert type="error" showIcon message="Không thể tải dữ liệu tổng quan từ Backend" />
  if (!summary) return <Skeleton active paragraph={{ rows: 10 }} />

  const metrics = [
    { label: 'Người dùng', value: summary.totalUsers.toString(), icon: <Users /> },
    { label: 'Tài xế', value: summary.totalDrivers.toString(), icon: <Truck /> },
    { label: 'Chủ bãi', value: summary.totalMerchants.toString(), icon: <Warehouse /> },
    { label: 'Tổng bãi đỗ', value: summary.totalParkingLots.toString(), icon: <CircleParking /> },
    { label: 'Bãi chờ duyệt', value: summary.pendingParkingLots.toString(), icon: <Clock3 /> },
    { label: 'Doanh thu nền tảng', value: formatAdminMoney(summary.successfulRevenue), icon: <CircleDollarSign /> },
  ]

  return <main className="admin-page">
    <AdminPageHeader eyebrow="TRUNG TÂM ĐIỀU HÀNH" title="Tổng quan hệ thống" description="Số liệu trực tiếp từ Backend SmartTruck." />
    <section className="admin-metrics">{metrics.map(item => <Metric key={item.label} {...item} />)}</section>
    <section className="admin-dashboard-grid">
      <article className="admin-panel admin-task-list">
        <header className="admin-card-title"><div><h2>Nghiệp vụ hệ thống</h2><p>Dữ liệu tổng hợp hiện có từ Backend</p></div></header>
        <Link to="/admin/parking-lots"><span>Bãi đỗ chờ duyệt</span><strong>{summary.pendingParkingLots}</strong></Link>
        <Link to="/admin/users"><span>Tổng tài khoản</span><strong>{summary.totalUsers}</strong></Link>
        <Link to="/admin/transactions"><span>Tổng lượt đặt chỗ</span><strong>{summary.totalBookings}</strong></Link>
        <Link to="/admin/audit-logs"><span>Kiểm tra audit log</span><strong>→</strong></Link>
      </article>
      <article className="admin-panel admin-chart">
        <header className="admin-card-title">
          <div>
            <h2>Trạng thái vận hành</h2>
            <p>Hệ thống giám sát và đối soát dữ liệu</p>
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
            <span>Tỷ lệ vận hành & đặt chỗ</span>
            <strong style={{ color: '#0284c7' }}>Hoạt động bình thường</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
            <span>Cổng thanh toán & đối soát ví</span>
            <strong style={{ color: '#16a34a' }}>Sẵn sàng (PayOS / Demo)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
            <span>Hàng đợi ảo & điều phối slot</span>
            <strong style={{ color: '#16a34a' }}>Kích hoạt tự động</strong>
          </div>
        </div>
      </article>
    </section>
  </main>
}

function Metric({ label, value, icon }: { readonly label: string; readonly value: string; readonly icon: ReactNode }) {
  return <article className="admin-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>
}

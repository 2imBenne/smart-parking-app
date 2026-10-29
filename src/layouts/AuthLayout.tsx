import { CarOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import truckIllustration from '../assets/smart-logistics-truck.png'

export function AuthLayout() {
  return (
    <main className="auth-shell auth-shell--stitch">
      <aside className="auth-hero auth-hero--stitch" aria-label="Giới thiệu SmartTruck Parking">
        <div className="auth-hero-brand">
          <span className="auth-hero-logo"><CarOutlined /></span>
          <span>SmartTruck</span>
        </div>
        <div className="auth-hero-copy auth-hero-copy--stitch">
          <h1>SmartTruck Parking</h1>
          <p>Giải pháp quản lý logistics và bãi đỗ an toàn, tin cậy dành cho vận hành xe tải chuyên nghiệp.</p>
        </div>
        <figure className="auth-truck-visual">
          <img src={truckIllustration} alt="Xe tải tại trung tâm logistics thông minh" />
        </figure>
        <p className="auth-hero-note">Kết nối tài xế và bãi đỗ trên một nền tảng vận hành thống nhất.</p>
      </aside>

      <section className="auth-panel auth-panel--stitch" aria-label="Khu vực xác thực">
        <div className="auth-mobile-brand">
          <span className="auth-hero-logo"><CarOutlined /></span>
          <strong>SmartTruck Parking</strong>
        </div>
        <Outlet />
      </section>
    </main>
  )
}

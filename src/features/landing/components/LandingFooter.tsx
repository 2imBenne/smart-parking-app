import { Globe2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingFooter() {
  return <footer className="stitch-footer"><div className="stitch-section footer-grid">
    <div><h3>SmartTruck</h3><p>Giải pháp quản lý và đặt chỗ bãi đỗ xe tải hàng đầu, kết nối tài xế với các trạm dừng an toàn.</p></div>
    <div><h4>Tài Xế</h4><Link to="/dashboard/search">Tìm bãi đỗ</Link><Link to="/solutions/drivers">Hướng dẫn tài xế</Link><Link to="/pricing">Ưu đãi</Link></div>
    <div><h4>Pháp Lý</h4><Link to="/company/about">Chính sách bảo mật</Link><Link to="/company/about">Điều khoản dịch vụ</Link></div>
    <div><h4>Hỗ Trợ</h4><Link to="/company/contact">Liên hệ</Link><Link to="/company/contact">Câu hỏi thường gặp</Link></div>
  </div><div className="footer-bottom stitch-section"><span>© 2026 Smart Parking Logistics. Bảo lưu mọi quyền.</span><Globe2 size={18} /></div></footer>
}

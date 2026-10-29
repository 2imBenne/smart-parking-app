import { ArrowRight, BarChart3, Check, CircleParking, CreditCard, QrCode, Search, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getAuthSession } from '../../../shared/auth/session'
import { LandingHeroMap } from '../components/LandingHeroMap'

const yardImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr5sO0I-DGnAdSpnVED6CrdBp6i_Vr5fgxxMkZplizPIbWM9HZ7aPnQ0GjBXQX_3iv39Ma8pGEuivXpRkyhA3W0uoj3FHLQ-V4cBjB9sCtt5UZVNytQP8mN6X7zmSXeiOdEN5qnNkjf1qSq6Z8qz4Q3cToEqadUZq2kV-T5Yi9-vuoHSs375ddNAHbNXDDRm1qksjxQ95APFAPyy0gRFBLLHahRGQHhxXIgsmjbrjLWelY1cGh9M4AJw'

export function LandingPage() {
  const navigate = useNavigate()
  const openDriver = () => navigate(getAuthSession() ? '/parking' : '/login', { state: { from: '/parking' } })
  const openOwner = () => navigate(getAuthSession() ? '/dashboard' : '/register')

  return <div className="logistics-landing">
    <section className="logistics-hero">
      <div className="logistics-dots" />
      <div className="logistics-hero-copy">
        <span className="logistics-kicker">NỀN TẢNG BÃI ĐỖ THÔNG MINH</span>
        <h1>Đặt chỗ xe tải<br />chỉ trong vài giây.</h1>
        <p>Kết nối tài xế với mạng lưới bãi đỗ an toàn. Theo dõi chỗ trống theo thời gian thực, đặt chỗ tức thì và quản lý hành trình dễ dàng.</p>
        <div className="logistics-actions"><button onClick={openDriver}>Tìm bãi đỗ <ArrowRight /></button><button className="ghost" onClick={openOwner}>Đăng ký chủ bãi</button></div>
        <div className="logistics-trust"><span>500+</span><p>tài xế tin dùng<br />120+ bãi đỗ toàn quốc</p></div>
      </div>
      <div className="logistics-product-preview">
        <div className="preview-browser"><i /><i /><i /><span /></div>
        <LandingHeroMap onOpenSearch={openDriver} />
        <div className="preview-cards"><div><CircleParking /><b>128</b><small>chỗ trống</small></div><div><QrCode /><b>42</b><small>check-in hôm nay</small></div></div>
      </div>
    </section>

    <section className="logistics-section logistics-benefits"><header><h2>Thiết kế riêng cho logistics</h2><p>Một nền tảng vận hành rõ ràng, ổn định cho ngành vận tải hạng nặng.</p></header><div className="benefit-grid">
      <Benefit icon={<Search />} title="Chỗ trống thời gian thực" text="Dữ liệu sức chứa được cập nhật liên tục để tài xế chủ động chọn điểm dừng." />
      <Benefit icon={<ShieldCheck />} title="Check-in an toàn" text="Xác thực bằng QR giúp giảm thời gian chờ và hạn chế sai lệch tại cổng bãi." />
      <Benefit icon={<CreditCard />} title="Thanh toán linh hoạt" text="Đặt cọc, thanh toán và lưu lịch sử giao dịch trên cùng một hệ thống." />
    </div></section>

    <section className="logistics-section logistics-audience">
      <div className="audience-image" style={{ backgroundImage: `url(${yardImage})` }}><span><CircleParking /> Đã xác nhận chỗ đỗ</span></div>
      <div className="audience-copy"><small>DÀNH CHO TÀI XẾ</small><h2>Lộ trình chủ động, không còn phỏng đoán.</h2><p>Tìm bãi, so sánh sức chứa và đặt trước vị trí phù hợp với loại xe trước khi khởi hành.</p><CheckLine text="Lọc bãi theo loại phương tiện và tình trạng còn chỗ" /><CheckLine text="Đặt chỗ, thanh toán và nhận mã QR trong một luồng" /><CheckLine text="Theo dõi lịch sử đặt chỗ và hóa đơn rõ ràng" /><button onClick={openDriver}>Tìm bãi ngay <ArrowRight /></button></div>
      <div className="audience-copy owner-copy"><small>DÀNH CHO CHỦ BÃI</small><h2>Tối ưu doanh thu trên từng vị trí đỗ.</h2><p>Quản lý sức chứa, giá, check-in và doanh thu bằng dữ liệu vận hành tập trung.</p><CheckLine text="Cấu hình slot và bảng giá theo loại xe" /><CheckLine text="Theo dõi doanh thu và booking hoàn thành" /><CheckLine text="Check-in/check-out nhanh bằng mã QR" /><button onClick={openOwner}>Mở cổng quản lý <ArrowRight /></button></div>
      <div className="revenue-preview"><header><span>Doanh thu</span><em>+14%</em></header><div className="revenue-bars">{[36,55,27,68,86,100,52].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="revenue-caption"><BarChart3 /> Báo cáo vận hành theo thời gian thực</div></div>
    </section>
  </div>
}

function Benefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <article><span>{icon}</span><h3>{title}</h3><p>{text}</p></article> }
function CheckLine({ text }: { text: string }) { return <div className="check-line"><Check /> <span>{text}</span></div> }

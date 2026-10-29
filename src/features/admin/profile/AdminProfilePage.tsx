import { KeyOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Avatar, Descriptions } from 'antd'
import { getAuthSession } from '../../../shared/auth/session'
import { AdminPageHeader } from '../shared/AdminPageHeader'

export function AdminProfilePage() {
  const session = getAuthSession()
  return <main className="admin-page"><AdminPageHeader eyebrow="TÀI KHOẢN QUẢN TRỊ" title="Hồ sơ Admin" description="Thông tin phiên đăng nhập và quyền truy cập hiện tại." /><section className="admin-detail-grid"><article className="admin-panel admin-detail-card"><h2>Thông tin tài khoản</h2><Descriptions column={1} items={[{ key: 'avatar', label: 'Tài khoản', children: <span><Avatar icon={<UserOutlined />} /> Quản trị viên Demo</span> }, { key: 'phone', label: 'Số điện thoại', children: session?.phone ?? '—' }, { key: 'role', label: 'Vai trò', children: 'ADMIN' }, { key: 'scope', label: 'Phạm vi', children: 'Quản trị toàn hệ thống' }]} /></article><aside className="admin-page"><Alert type="success" showIcon icon={<SafetyCertificateOutlined />} message="Phiên được bảo vệ bằng RBAC" description="Các route Admin chỉ cho phép role ADMIN truy cập." /><Alert type="info" showIcon icon={<KeyOutlined />} message="Tài khoản demo" description="Phiên demo dùng dữ liệu cục bộ. Khi nối BE, lịch sử và quyền hạn phải được xác minh lại từ server." /></aside></section></main>
}

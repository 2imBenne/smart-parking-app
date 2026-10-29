import { ArrowLeftOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Input, Modal, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminUser } from '../types/adminTypes'

export function AdminUserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<'BAN' | 'UNBAN' | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    let active = true
    void adminRepository.user(Number(userId))
      .then(data => { if (active) setItem(data) })
      .catch(error => message.error(error instanceof Error ? error.message : 'Không thể tải người dùng'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  const handleStatus = async () => {
    if (!item || !action) return
    if (!reason.trim()) { message.warning('Vui lòng nhập lý do xử lý tài khoản.'); return }
    try {
      const updated = await adminRepository.setUserStatus(item.id, action === 'BAN' ? 'BANNED' : 'ACTIVE', reason.trim())
      setItem(updated)
      setAction(null)
      setReason('')
      message.success(action === 'BAN' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái')
    }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (!item) return <Alert type="error" showIcon message="Không tìm thấy người dùng" />

  const details = [
    { key: 'phone', label: 'Số điện thoại', children: item.phone },
    { key: 'role', label: 'Vai trò', children: <AdminStatusTag status={item.role} /> },
    { key: 'status', label: 'Trạng thái', children: <AdminStatusTag status={item.status} /> },
    { key: 'createdAt', label: 'Ngày tạo', children: formatAdminDate(item.createdAt) },
    { key: 'lastLogin', label: 'Đăng nhập gần nhất', children: item.lastLoginAt ? formatAdminDate(item.lastLoginAt) : 'Backend chưa cung cấp' },
    { key: 'activity', label: 'Số hoạt động', children: item.activityCount ?? 'Backend chưa cung cấp' },
    { key: 'disputes', label: 'Số tranh chấp', children: item.disputeCount ?? 'Backend chưa cung cấp' },
  ]

  return <main className="admin-page">
    <AdminPageHeader eyebrow="THÔNG TIN NGƯỜI DÙNG" title={item.fullName} description={`${item.phone} · Tham gia ${formatAdminDate(item.createdAt)}`} actions={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/users')}>Danh sách</Button>} />
    <section className="admin-detail-grid">
      <article className="admin-panel admin-detail-card"><h2>Thông tin tài khoản</h2><Descriptions column={1} items={details} /></article>
      <aside className="admin-panel admin-detail-card admin-decision-box">
        <h2>Kiểm soát tài khoản</h2>
        {item.statusReason && <Alert type="info" showIcon message="Lý do xử lý gần nhất" description={item.statusReason} />}
        {item.status === 'ACTIVE'
          ? <Button danger icon={<LockOutlined />} disabled={item.role === 'ADMIN'} onClick={() => setAction('BAN')}>Khóa tài khoản</Button>
          : <Button type="primary" icon={<UnlockOutlined />} onClick={() => setAction('UNBAN')}>Mở khóa tài khoản</Button>}
      </aside>
    </section>
    <Modal open={Boolean(action)} title={action === 'BAN' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'} okText="Xác nhận" cancelText="Hủy" onOk={() => void handleStatus()} onCancel={() => { setAction(null); setReason('') }}>
      <p>Nhập lý do để lưu vết kiểm toán và hỗ trợ đối soát.</p>
      <Input.TextArea autoFocus showCount maxLength={500} rows={4} value={reason} onChange={event => setReason(event.target.value)} placeholder="Nhập lý do xử lý tài khoản" />
    </Modal>
  </main>
}

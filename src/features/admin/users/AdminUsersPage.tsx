import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminUser } from '../types/adminTypes'

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const navigate = useNavigate()
  useEffect(() => { let active = true; void adminRepository.users().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (role === 'ALL' || item.role === role) && (status === 'ALL' || item.status === status) && `${item.fullName} ${item.phone}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, role, status])
  const columns: ColumnsType<AdminUser> = [
    { title: 'Người dùng', key: 'user', render: (_, item) => <span><strong>{item.fullName}</strong><br /><small>{item.phone}</small></span> },
    { title: 'Vai trò', dataIndex: 'role', render: value => <AdminStatusTag status={value} /> },
    { title: 'Trạng thái', dataIndex: 'status', render: value => <AdminStatusTag status={value} /> },
    { title: 'Hoạt động', dataIndex: 'activityCount', align: 'right', render: value => value ?? '—' },
    { title: 'Đăng nhập gần nhất', dataIndex: 'lastLoginAt', render: value => value ? formatAdminDate(value) : '—' },
    { title: '', key: 'action', align: 'right', render: (_, item) => <Button icon={<EyeOutlined />} onClick={() => navigate(`/admin/users/${item.id}`)}>Chi tiết</Button> },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="TÀI KHOẢN & PHÂN QUYỀN" title="Quản lý người dùng" description="Kiểm soát trạng thái tài khoản và truy vết các hành vi cần chú ý." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm theo tên hoặc số điện thoại" value={query} onChange={event => setQuery(event.target.value)} /><Select value={role} onChange={setRole} options={[{ value: 'ALL', label: 'Tất cả vai trò' }, { value: 'DRIVER', label: 'Tài xế' }, { value: 'MERCHANT', label: 'Chủ bãi' }, { value: 'ADMIN', label: 'Quản trị viên' }]} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'ACTIVE', label: 'Hoạt động' }, { value: 'BANNED', label: 'Đã khóa' }, { value: 'LOCKED', label: 'Tạm khóa' }]} /><span>{visible.length} tài khoản</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={{ pageSize: 10, showSizeChanger: false }} rowKey="id" /> : <div className="admin-empty"><Empty description="Không tìm thấy tài khoản phù hợp" /></div>}</section></main>
}

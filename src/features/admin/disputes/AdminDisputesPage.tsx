import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate, formatAdminMoney } from '../shared/adminFormat'
import type { AdminDispute } from '../types/adminTypes'

export function AdminDisputesPage() {
  const [items, setItems] = useState<AdminDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const navigate = useNavigate()
  useEffect(() => { let active = true; void adminRepository.disputes().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (status === 'ALL' || item.status === status) && `${item.code} ${item.title} ${item.reporterName} ${item.bookingCode}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, status])
  const columns: ColumnsType<AdminDispute> = [
    { title: 'Ticket', key: 'ticket', render: (_, item) => <span><strong>{item.code}</strong><br /><small>{item.title}</small></span> },
    { title: 'Người gửi', dataIndex: 'reporterName' },
    { title: 'Booking', dataIndex: 'bookingCode' },
    { title: 'Giá trị', dataIndex: 'amount', align: 'right', render: formatAdminMoney },
    { title: 'Ưu tiên', dataIndex: 'priority', render: value => <AdminStatusTag status={value} /> },
    { title: 'Trạng thái', dataIndex: 'status', render: value => <AdminStatusTag status={value} /> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: formatAdminDate },
    { title: '', key: 'action', render: (_, item) => <Button icon={<EyeOutlined />} onClick={() => navigate(`/admin/disputes/${item.id}`)}>Xử lý</Button> },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="HỖ TRỢ KHÁCH HÀNG" title="Khiếu nại và tranh chấp" description="Đối chiếu booking, giao dịch và bằng chứng trước khi đưa ra quyết định." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm ticket, booking hoặc người gửi" value={query} onChange={event => setQuery(event.target.value)} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'OPEN', label: 'Mới' }, { value: 'IN_REVIEW', label: 'Đang xử lý' }, { value: 'WAITING_EVIDENCE', label: 'Chờ bằng chứng' }, { value: 'RESOLVED', label: 'Đã giải quyết' }, { value: 'CLOSED', label: 'Đã đóng' }]} /><span>{visible.length} ticket</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={false} rowKey="id" /> : <div className="admin-empty"><Empty description="Không có khiếu nại phù hợp" /></div>}</section></main>
}

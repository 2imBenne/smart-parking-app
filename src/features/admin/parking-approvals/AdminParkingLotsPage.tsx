import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminParkingLot } from '../types/adminTypes'

export function AdminParkingLotsPage() {
  const [items, setItems] = useState<AdminParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const navigate = useNavigate()
  useEffect(() => { let active = true; void adminRepository.parkingLots().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (status === 'ALL' || item.status === status) && `${item.name} ${item.merchantName} ${item.address}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, status])
  const columns: ColumnsType<AdminParkingLot> = [
    { title: 'Bãi đỗ', key: 'lot', render: (_, item) => <span><strong>{item.name}</strong><br /><small>{item.address}</small></span> },
    { title: 'Merchant', dataIndex: 'merchantName' },
    { title: 'Sức chứa', dataIndex: 'totalCapacity', align: 'right' },
    { title: 'Ngày gửi', dataIndex: 'submittedAt', render: formatAdminDate },
    { title: 'Trạng thái', dataIndex: 'status', render: value => <AdminStatusTag status={value} /> },
    { title: '', key: 'action', align: 'right', render: (_, item) => <Button icon={<EyeOutlined />} onClick={() => navigate(`/admin/parking-lots/${item.id}`)}>Kiểm tra</Button> },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="VẬN HÀNH HỆ THỐNG" title="Kiểm duyệt bãi đỗ" description="Kiểm tra hồ sơ, vị trí và năng lực vận hành trước khi công khai bãi." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên bãi, Merchant hoặc địa chỉ" value={query} onChange={event => setQuery(event.target.value)} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' }, { value: 'CHANGES_REQUESTED', label: 'Yêu cầu bổ sung' }, { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'REJECTED', label: 'Đã từ chối' }]} /><span>{visible.length} hồ sơ</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={{ pageSize: 8, showSizeChanger: false }} rowKey="id" /> : <div className="admin-empty"><Empty description="Không có hồ sơ phù hợp" /></div>}</section></main>
}

import { SearchOutlined } from '@ant-design/icons'
import { Empty, Input, Select, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminAuditLog } from '../types/adminTypes'

export function AdminAuditLogsPage() {
  const [items, setItems] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [entity, setEntity] = useState('ALL')
  useEffect(() => { let active = true; void adminRepository.auditLogs().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (entity === 'ALL' || item.entityType === entity) && `${item.actor} ${item.action} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase())), [entity, items, query])
  const columns: ColumnsType<AdminAuditLog> = [
    { title: 'Thời gian', dataIndex: 'createdAt', render: formatAdminDate },
    { title: 'Actor', dataIndex: 'actor' },
    { title: 'Hành động', dataIndex: 'action' },
    { title: 'Đối tượng', key: 'entity', render: (_, item) => `${item.entityType} #${item.entityId}` },
    { title: 'Kết quả', dataIndex: 'result', render: value => <AdminStatusTag status={value} /> },
    { title: 'Chi tiết', dataIndex: 'detail' },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="FR-29 · TRUY VẾT" title="Audit log" description="Lịch sử bất biến của các thao tác kiểm duyệt, tài khoản và tài chính." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm actor, hành động hoặc nội dung" value={query} onChange={event => setQuery(event.target.value)} /><Select value={entity} onChange={setEntity} options={[{ value: 'ALL', label: 'Tất cả đối tượng' }, { value: 'PARKING_LOT', label: 'Bãi đỗ' }, { value: 'USER', label: 'Người dùng' }, { value: 'WITHDRAWAL', label: 'Rút tiền' }, { value: 'DISPUTE', label: 'Khiếu nại' }]} /><span>{visible.length} bản ghi</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={{ pageSize: 12, showSizeChanger: false }} rowKey="id" /> : <div className="admin-empty"><Empty description="Không có audit log phù hợp" /></div>}</section></main>
}

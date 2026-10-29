import { EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Descriptions, Empty, Input, Modal, Select, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate, formatAdminMoney } from '../shared/adminFormat'
import type { AdminTransaction } from '../types/adminTypes'

const typeLabels: Record<string, string> = { DEPOSIT: 'Tiền cọc', FINAL_PAYMENT: 'Thanh toán cuối', OVERTIME_FEE: 'Phí quá giờ', REFUND: 'Hoàn tiền', WITHDRAWAL: 'Rút tiền' }

export function AdminTransactionsPage() {
  const [items, setItems] = useState<AdminTransaction[]>([])
  const [selected, setSelected] = useState<AdminTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  useEffect(() => { let active = true; void adminRepository.transactions().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (status === 'ALL' || item.status === status) && `${item.code} ${item.bookingCode} ${item.payerName} ${item.merchantName}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, status])
  const columns: ColumnsType<AdminTransaction> = [
    { title: 'Giao dịch', key: 'transaction', render: (_, item) => <span><strong>{item.code}</strong><br /><small>{item.bookingCode}</small></span> },
    { title: 'Người thanh toán', dataIndex: 'payerName' },
    { title: 'Loại', dataIndex: 'type', render: value => typeLabels[value] ?? value },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: formatAdminMoney },
    { title: 'Trạng thái', dataIndex: 'status', render: value => <AdminStatusTag status={value} /> },
    { title: 'Thời gian', dataIndex: 'createdAt', render: formatAdminDate },
    { title: '', key: 'action', render: (_, item) => <Button aria-label={`Xem ${item.code}`} icon={<EyeOutlined />} onClick={() => setSelected(item)} /> },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="QUẢN LÝ TÀI CHÍNH" title="Giao dịch và đối soát" description="Theo dõi luồng tiền cọc, phí đỗ, phí quá giờ và hoàn tiền." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm mã giao dịch, booking hoặc người dùng" value={query} onChange={event => setQuery(event.target.value)} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'SUCCESS', label: 'Thành công' }, { value: 'PENDING', label: 'Đang chờ' }, { value: 'FAILED', label: 'Thất bại' }, { value: 'REFUNDED', label: 'Đã hoàn tiền' }]} /><span>{visible.length} giao dịch</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={false} rowKey="id" /> : <div className="admin-empty"><Empty description="Không có giao dịch phù hợp" /></div>}</section><Modal footer={null} open={Boolean(selected)} title="Chi tiết giao dịch" onCancel={() => setSelected(null)}>{selected && <Descriptions column={1} bordered items={[{ key: 'code', label: 'Mã giao dịch', children: selected.code }, { key: 'booking', label: 'Booking', children: selected.bookingCode }, { key: 'payer', label: 'Người thanh toán', children: selected.payerName }, { key: 'merchant', label: 'Merchant', children: selected.merchantName }, { key: 'gateway', label: 'Cổng thanh toán', children: selected.gateway }, { key: 'amount', label: 'Số tiền', children: formatAdminMoney(selected.amount) }, { key: 'status', label: 'Trạng thái', children: <AdminStatusTag status={selected.status} /> }, { key: 'time', label: 'Thời gian', children: formatAdminDate(selected.createdAt) }]} />}</Modal></main>
}

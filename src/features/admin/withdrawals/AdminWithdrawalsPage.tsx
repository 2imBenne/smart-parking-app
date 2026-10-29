import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Modal, Select, Skeleton, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate, formatAdminMoney } from '../shared/adminFormat'
import type { AdminWithdrawal, AdminWithdrawalStatus } from '../types/adminTypes'

export function AdminWithdrawalsPage() {
  const [items, setItems] = useState<AdminWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null)
  const [decision, setDecision] = useState<Exclude<AdminWithdrawalStatus, 'PENDING'> | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => { let active = true; void adminRepository.withdrawals().then(data => { if (active) setItems(data) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => items.filter(item => (status === 'ALL' || item.status === status) && `${item.code} ${item.merchantName} ${item.merchantPhone}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query, status])
  const openDecision = (item: AdminWithdrawal, next: Exclude<AdminWithdrawalStatus, 'PENDING'>) => { setSelected(item); setDecision(next); setNote('') }
  const handleDecision = async () => { if (!selected || !decision) return; if (!note.trim()) { message.warning('Vui lòng nhập ghi chú đối soát.'); return } const updated = await adminRepository.decideWithdrawal(selected.id, decision, note.trim()); setItems(previous => previous.map(item => item.id === updated.id ? { ...updated } : item)); setDecision(null); setSelected(null); message.success(decision === 'APPROVED' ? 'Đã duyệt yêu cầu rút tiền.' : 'Đã từ chối yêu cầu rút tiền.') }
  const columns: ColumnsType<AdminWithdrawal> = [
    { title: 'Yêu cầu', key: 'request', render: (_, item) => <span><strong>{item.code}</strong><br /><small>{formatAdminDate(item.requestedAt)}</small></span> },
    { title: 'Merchant', key: 'merchant', render: (_, item) => <span><strong>{item.merchantName}</strong><br /><small>{item.merchantPhone}</small></span> },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: formatAdminMoney },
    { title: 'Số dư', dataIndex: 'availableBalance', align: 'right', render: formatAdminMoney },
    { title: 'Ngân hàng', key: 'bank', render: (_, item) => `${item.bankName} · ${item.bankAccount}` },
    { title: 'Trạng thái', dataIndex: 'status', render: value => <AdminStatusTag status={value} /> },
    { title: 'Thao tác', key: 'actions', render: (_, item) => item.status === 'PENDING' ? <div className="admin-page-actions"><Button type="primary" icon={<CheckOutlined />} onClick={() => openDecision(item, 'APPROVED')}>Duyệt</Button><Button danger icon={<CloseOutlined />} onClick={() => openDecision(item, 'REJECTED')}>Từ chối</Button></div> : item.reviewNote ?? 'Đã xử lý' },
  ]
  return <main className="admin-page"><AdminPageHeader eyebrow="QUẢN LÝ RÚT TIỀN" title="Yêu cầu rút tiền" description="Kiểm tra số dư, tài khoản nhận và lịch sử giao dịch trước khi duyệt chi." /><section className="admin-panel"><div className="admin-toolbar"><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm mã yêu cầu hoặc Merchant" value={query} onChange={event => setQuery(event.target.value)} /><Select value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'PENDING', label: 'Chờ xử lý' }, { value: 'APPROVED', label: 'Đã duyệt' }, { value: 'REJECTED', label: 'Đã từ chối' }]} /><span>{visible.length} yêu cầu</span></div>{loading ? <div className="admin-empty"><Skeleton active /></div> : visible.length ? <Table className="admin-table" columns={columns} dataSource={visible} pagination={false} rowKey="id" /> : <div className="admin-empty"><Empty description="Không có yêu cầu phù hợp" /></div>}</section><Modal open={Boolean(decision)} title={decision === 'APPROVED' ? 'Duyệt yêu cầu rút tiền' : 'Từ chối yêu cầu rút tiền'} okText="Xác nhận" cancelText="Hủy" onOk={() => void handleDecision()} onCancel={() => { setDecision(null); setSelected(null) }}>{selected && <p><strong>{selected.merchantName}</strong> yêu cầu rút <strong>{formatAdminMoney(selected.amount)}</strong>.</p>}<Input.TextArea autoFocus maxLength={500} rows={4} showCount value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập kết quả đối soát hoặc lý do từ chối" /></Modal></main>
}

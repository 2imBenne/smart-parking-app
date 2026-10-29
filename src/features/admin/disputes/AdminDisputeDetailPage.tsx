import { ArrowLeftOutlined, CheckCircleOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Input, Modal, Select, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate, formatAdminMoney } from '../shared/adminFormat'
import type { AdminDispute, AdminDisputeStatus } from '../types/adminTypes'

export function AdminDisputeDetailPage() {
  const { disputeId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<AdminDispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<AdminDisputeStatus>('RESOLVED')
  const [resolution, setResolution] = useState('')
  useEffect(() => { let active = true; void adminRepository.dispute(Number(disputeId)).then(data => { if (active) setItem(data) }).catch(error => message.error(error instanceof Error ? error.message : 'Không thể tải khiếu nại')).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [disputeId])
  const handleResolve = async () => { if (!item || !resolution.trim()) { message.warning('Vui lòng nhập kết quả xử lý.'); return } const updated = await adminRepository.resolveDispute(item.id, status, resolution.trim()); setItem({ ...updated }); setOpen(false); setResolution(''); message.success('Đã cập nhật kết quả khiếu nại.') }
  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (!item) return <Alert type="error" showIcon message="Không tìm thấy khiếu nại" />
  return <main className="admin-page"><AdminPageHeader eyebrow="CHI TIẾT KHIẾU NẠI" title={item.code} description={`${item.title} · Tạo ${formatAdminDate(item.createdAt)}`} actions={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/disputes')}>Danh sách</Button>} /><section className="admin-detail-grid"><article className="admin-panel admin-detail-card"><h2>Nội dung khiếu nại</h2><Descriptions column={1} bordered items={[{ key: 'status', label: 'Trạng thái', children: <AdminStatusTag status={item.status} /> }, { key: 'priority', label: 'Ưu tiên', children: <AdminStatusTag status={item.priority} /> }, { key: 'reporter', label: 'Người gửi', children: `${item.reporterName} · ${item.reporterRole}` }, { key: 'booking', label: 'Booking', children: item.bookingCode }, { key: 'lot', label: 'Bãi đỗ', children: item.parkingLotName }, { key: 'amount', label: 'Giá trị liên quan', children: formatAdminMoney(item.amount) }, { key: 'content', label: 'Mô tả', children: item.description }, { key: 'evidence', label: 'Bằng chứng', children: `${item.evidenceCount} tệp` }]} />{item.resolution && <Alert type="success" showIcon message="Kết quả xử lý" description={item.resolution} />}</article><aside className="admin-panel admin-detail-card admin-decision-box"><h2>Thao tác xử lý</h2><Alert type="info" showIcon icon={<FileSearchOutlined />} message="Kiểm tra đủ dữ liệu" description="Đối chiếu booking, payment, thời gian check-in/out và bằng chứng của hai bên." /><Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setOpen(true)}>Cập nhật kết quả</Button></aside></section><Modal open={open} title="Cập nhật kết quả tranh chấp" okText="Lưu kết quả" cancelText="Hủy" onOk={() => void handleResolve()} onCancel={() => setOpen(false)}><Select value={status} onChange={setStatus} options={[{ value: 'IN_REVIEW', label: 'Đang xử lý' }, { value: 'WAITING_EVIDENCE', label: 'Chờ bổ sung bằng chứng' }, { value: 'RESOLVED', label: 'Đã giải quyết' }, { value: 'CLOSED', label: 'Đã đóng' }]} /><Input.TextArea autoFocus maxLength={1000} rows={5} showCount value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Ghi rõ căn cứ, quyết định hoàn tiền/phạt/cảnh báo và kết quả cuối cùng" /></Modal></main>
}

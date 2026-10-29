import { ArrowLeftOutlined, CheckOutlined, EditOutlined, FileImageOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Empty, Image, Input, Modal, Skeleton, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { AdminStatusTag } from '../shared/AdminStatusTag'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminParkingLot, AdminParkingStatus } from '../types/adminTypes'
import { AdminParkingLotMap } from './AdminParkingLotMap'

export function AdminParkingLotDetailPage() {
  const { parkingLotId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<AdminParkingLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState<Exclude<AdminParkingStatus, 'PENDING_APPROVAL'> | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    void adminRepository.parkingLot(Number(parkingLotId))
      .then(data => { if (active) setItem(data) })
      .catch(error => message.error(error instanceof Error ? error.message : 'Không thể tải hồ sơ'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [parkingLotId])

  const handleDecision = async () => {
    if (!item || !decision) return
    if (!note.trim()) { message.warning('Vui lòng nhập ghi chú kiểm duyệt.'); return }
    setSubmitting(true)
    try {
      const updated = await adminRepository.decideParkingLot(item.id, decision, note.trim())
      setItem({ ...updated }); setDecision(null); setNote('')
      message.success('Đã cập nhật kết quả kiểm duyệt.')
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally { setSubmitting(false) }
  }

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} />
  if (!item) return <Alert type="error" showIcon message="Không tìm thấy hồ sơ bãi đỗ" action={<Button onClick={() => navigate('/admin/parking-lots')}>Quay lại</Button>} />

  const details = [
    { key: 'status', label: 'Trạng thái', children: <AdminStatusTag status={item.status} /> },
    { key: 'merchant', label: 'Merchant', children: `${item.merchantName} · ${item.merchantPhone}` },
    { key: 'address', label: 'Địa chỉ', children: item.address },
    { key: 'capacity', label: 'Sức chứa', children: `${item.totalCapacity} chỗ` },
    { key: 'vehicles', label: 'Loại xe', children: item.vehicleTypes.join(', ') },
    { key: 'images', label: 'Hình ảnh', children: `${item.imageCount} ảnh` },
    { key: 'documents', label: 'Hồ sơ pháp lý', children: item.documentsComplete ? 'Đầy đủ' : 'Chưa đầy đủ' },
    { key: 'description', label: 'Mô tả', children: item.description },
  ]

  return <main className="admin-page">
    <AdminPageHeader eyebrow="CHI TIẾT BÃI ĐỖ" title={item.name} description={`Gửi lúc ${formatAdminDate(item.submittedAt)} bởi ${item.merchantName}.`} actions={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/parking-lots')}>Danh sách</Button>} />
    <section className="admin-detail-grid">
      <div className="admin-detail-main">
        <article className="admin-panel admin-detail-card"><h2>Thông tin vận hành</h2><Descriptions bordered column={{ xs: 1, md: 2 }} items={details} /></article>
        <article className="admin-panel admin-detail-card admin-parking-gallery">
          <header>
            <div><h2>Hình ảnh bãi đỗ</h2><p>Ảnh do Merchant gửi kèm hồ sơ đăng ký.</p></div>
            <Tag icon={<FileImageOutlined />} color={item.images.length ? 'cyan' : 'default'}>{item.images.length} ảnh</Tag>
          </header>
          {item.images.length ? (
            <Image.PreviewGroup>
              <div className="admin-parking-gallery-grid">
                {item.images.map((image, index) => (
                  <figure key={image.id} className={image.cover ? 'is-cover' : undefined}>
                    <Image
                      src={image.contentUrl}
                      alt={image.originalFileName || `Ảnh bãi đỗ ${index + 1}`}
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='300' viewBox='0 0 480 300'%3E%3Crect width='480' height='300' fill='%23f2f4f7'/%3E%3Ctext x='240' y='150' text-anchor='middle' dominant-baseline='middle' fill='%23667085' font-family='Arial' font-size='16'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E"
                    />
                    <figcaption>
                      <span title={image.originalFileName}>{image.originalFileName || `Ảnh ${index + 1}`}</span>
                      {image.cover && <Tag color="green">Ảnh đại diện</Tag>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Image.PreviewGroup>
          ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Merchant chưa gửi hình ảnh bãi đỗ" />}
        </article>
        <article className="admin-panel admin-detail-card"><h2>Vị trí đăng ký</h2><AdminParkingLotMap latitude={item.latitude} longitude={item.longitude} name={item.name} address={item.address} /></article>
      </div>
      <aside className="admin-panel admin-detail-card admin-decision-box">
        <h2>Kết quả kiểm duyệt</h2>
        {item.reviewNote && <Alert type="info" showIcon message="Ghi chú gần nhất" description={item.reviewNote} />}
        <Alert type="info" showIcon message={`${item.imageCount} ảnh đã được gửi. Hồ sơ pháp lý cần được đối chiếu theo quy trình vận hành.`} />
        {item.status === 'PENDING_APPROVAL' ? (
          <>
            <Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('APPROVED')}>Duyệt bãi</Button>
            <Button icon={<EditOutlined />} onClick={() => setDecision('CHANGES_REQUESTED')}>Yêu cầu bổ sung</Button>
            <Button danger icon={<StopOutlined />} onClick={() => setDecision('REJECTED')}>Từ chối hồ sơ</Button>
          </>
        ) : (
          <Alert type="info" showIcon message="Hồ sơ đã được xử lý" description="Quyết định đã được lưu và không thể xử lý lại trên hồ sơ này." />
        )}
      </aside>
    </section>
    <Modal open={Boolean(decision)} confirmLoading={submitting} maskClosable={!submitting} closable={!submitting} title={decision === 'APPROVED' ? 'Xác nhận duyệt bãi' : decision === 'REJECTED' ? 'Từ chối hồ sơ' : 'Yêu cầu bổ sung hồ sơ'} okText="Xác nhận" cancelText="Hủy" onOk={() => void handleDecision()} onCancel={() => { if (!submitting) { setDecision(null); setNote('') } }}>
      <p>{decision === 'CHANGES_REQUESTED' ? 'Mô tả rõ thông tin Merchant cần bổ sung/sửa lại.' : 'Ghi rõ kết quả đối chiếu hoặc nội dung Merchant cần bổ sung.'}</p>
      <Input.TextArea autoFocus showCount maxLength={500} rows={4} value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập ghi chú kiểm duyệt" />
    </Modal>
  </main>
}

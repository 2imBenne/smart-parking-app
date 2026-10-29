import { Button, Empty, Skeleton } from 'antd'
import { BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminRepository } from '../api/adminRepository'
import { AdminPageHeader } from '../shared/AdminPageHeader'
import { formatAdminDate } from '../shared/adminFormat'
import type { AdminNotification } from '../types/adminTypes'

export function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const load = async () => { const data = await adminRepository.notifications(); setItems(data); setLoading(false) }
  useEffect(() => { let active = true; void adminRepository.notifications().then(data => { if (active) { setItems(data); setLoading(false) } }); return () => { active = false } }, [])
  const openNotification = async (item: AdminNotification) => { await adminRepository.markNotification(item.id); await load(); navigate(item.path) }
  const unread = items.filter(item => !item.read).length
  return <main className="admin-page"><AdminPageHeader eyebrow="FR-28 · SỰ KIỆN HỆ THỐNG" title="Thông báo quản trị" description="Các hồ sơ, giao dịch và tranh chấp cần Admin chú ý." actions={<Button disabled={!unread} onClick={() => void adminRepository.markNotification().then(load)}>Đánh dấu tất cả đã đọc</Button>} /><section className="admin-panel">{loading ? <div className="admin-empty"><Skeleton active /></div> : items.length ? <div className="admin-notification-list">{items.map(item => <button className={item.read ? '' : 'unread'} key={item.id} type="button" onClick={() => void openNotification(item)}>{item.read ? <BellRing size={18} aria-hidden="true" /> : <i aria-hidden="true" />}<span><strong>{item.title}</strong><span>{item.content}</span><small>{formatAdminDate(item.createdAt)}</small></span></button>)}</div> : <div className="admin-empty"><Empty description="Bạn chưa có thông báo" /></div>}</section></main>
}

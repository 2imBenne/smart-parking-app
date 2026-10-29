import { Tag } from 'antd'

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Chờ duyệt',
  CHANGES_REQUESTED: 'Yêu cầu bổ sung',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  ACTIVE: 'Hoạt động',
  BANNED: 'Đã khóa',
  LOCKED: 'Tạm khóa',
  SUCCESS: 'Thành công',
  PENDING: 'Đang chờ',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
  OPEN: 'Mới',
  IN_REVIEW: 'Đang xử lý',
  WAITING_EVIDENCE: 'Chờ bằng chứng',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
  DRIVER: 'Tài xế',
  MERCHANT: 'Chủ bãi',
  ADMIN: 'Quản trị viên',
}

const statusColors: Record<string, string> = {
  APPROVED: 'green',
  ACTIVE: 'green',
  SUCCESS: 'green',
  RESOLVED: 'green',
  PENDING_APPROVAL: 'gold',
  CHANGES_REQUESTED: 'purple',
  PENDING: 'gold',
  OPEN: 'orange',
  IN_REVIEW: 'blue',
  WAITING_EVIDENCE: 'purple',
  REJECTED: 'red',
  BANNED: 'red',
  FAILED: 'red',
  HIGH: 'red',
  REFUNDED: 'cyan',
  CLOSED: 'default',
  LOCKED: 'default',
  MEDIUM: 'gold',
  LOW: 'default',
  DRIVER: 'blue',
  MERCHANT: 'purple',
  ADMIN: 'red',
}

export function AdminStatusTag({ status }: { readonly status: string }) {
  return <Tag color={statusColors[status] ?? 'default'}>{statusLabels[status] ?? status}</Tag>
}

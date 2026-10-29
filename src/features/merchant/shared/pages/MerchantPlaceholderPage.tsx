import { ApiOutlined, ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Button, Result, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'

type MerchantPlaceholderPageProps = {
  title: string
  description: string
  backendStatus: 'AVAILABLE' | 'PARTIAL' | 'BLOCKED_BY_BACKEND'
  apiEndpoints?: string[]
}

const statusMeta = {
  AVAILABLE: { color: 'green', label: 'Backend API sẵn sàng', icon: <CheckCircleOutlined /> },
  PARTIAL: { color: 'gold', label: 'Backend API hỗ trợ một phần', icon: <ClockCircleOutlined /> },
  BLOCKED_BY_BACKEND: { color: 'default', label: 'BLOCKED_BY_BACKEND', icon: <ApiOutlined /> },
} as const

export function MerchantPlaceholderPage({ title, description, backendStatus, apiEndpoints = [] }: MerchantPlaceholderPageProps) {
  const navigate = useNavigate()
  const status = statusMeta[backendStatus]

  return (
    <section className="merchant-placeholder-page">
      <Result
        icon={status.icon}
        title={title}
        subTitle={description}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/merchant/dashboard')}>Về tổng quan</Button>}
      />
      <div className="merchant-contract-card">
        <Tag color={status.color}>{status.label}</Tag>
        {apiEndpoints.length > 0 && (
          <div><strong>API contract hiện có</strong>{apiEndpoints.map((endpoint) => <code key={endpoint}>{endpoint}</code>)}</div>
        )}
        {backendStatus === 'BLOCKED_BY_BACKEND' && <p>Không tạo dữ liệu mock hoặc endpoint giả. Trang sẽ được kích hoạt khi backend cung cấp contract.</p>}
      </div>
    </section>
  )
}

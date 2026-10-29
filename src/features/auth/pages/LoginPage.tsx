import { LockOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Form, Input, Spin, message } from 'antd'
import type { AxiosError } from 'axios'
import { ShieldCheck, Store, Truck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/authApi'
import type { LoginRequest, UserRole } from '../types/authTypes'
import { saveAuthSession } from '../../../shared/auth/session'
import { extractApiError } from '../../../shared/api/errors'
import { AuthFormCard } from '../components/AuthFormCard'
import { getRoleHomePath } from '../../../shared/auth/roleRouting'

type LocationState = {
  from?: string
}

type DemoAccount = {
  id: string
  label: string
  phone: string
  password: string
  role: UserRole
  description: string
  icon: typeof Truck
  tone: 'blue' | 'teal' | 'orange' | 'purple'
}

const demoAccounts: DemoAccount[] = [
  { id: 'driver-1', label: 'Driver 1', phone: '0909128374', password: 'password123', role: 'DRIVER', description: 'Nguyễn Văn Hùng · 0909 128 374', icon: Truck, tone: 'blue' },
  { id: 'driver-2', label: 'Driver 2', phone: '0918239485', password: 'password123', role: 'DRIVER', description: 'Trần Quốc Tuấn · 0918 239 485', icon: UserRound, tone: 'teal' },
  { id: 'merchant', label: 'Merchant', phone: '0908123456', password: 'password123', role: 'MERCHANT', description: 'Lê Văn Thành · 0908 123 456', icon: Store, tone: 'orange' },
  { id: 'admin', label: 'Admin', phone: '0903829145', password: 'password123', role: 'ADMIN', description: 'Nguyễn Hoàng Nam · 0903 829 145', icon: ShieldCheck, tone: 'purple' },
]

export function LoginPage() {
  const [form] = Form.useForm<LoginRequest>()
  const [submitting, setSubmitting] = useState(false)
  const [demoLoadingId, setDemoLoadingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const loginDemoAccount = async (account: DemoAccount) => {
    setDemoLoadingId(account.id)
    try {
      const auth = await login({ phone: account.phone, password: account.password })
      saveAuthSession({ token: auth.token, role: auth.role, phone: account.phone })
      message.success(`Đã vào tài khoản demo ${account.label}`)
      navigate(getRoleHomePath(auth.role), { replace: true })
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setDemoLoadingId(null)
    }
  }

  const onFinish = async (values: LoginRequest) => {
    setSubmitting(true)
    try {
      const auth = await login(values)
      saveAuthSession({
        token: auth.token,
        role: auth.role,
        phone: values.phone,
      })
      message.success('Đăng nhập thành công!')
      navigate(getSafeDestination(auth.role, state?.from), { replace: true })
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      description="Đăng nhập để tiếp tục quản lý đặt chỗ, QR và đối soát theo đúng vai trò của bạn."
      eyebrow="Welcome back"
      footer={
        <p>
          Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
        </p>
      }
      legal={
        <p>
          Bằng việc tiếp tục, bạn đồng ý với <a href="#terms">Điều khoản</a> và{' '}
          <a href="#privacy">Chính sách bảo mật</a>.
        </p>
      }
      title="Đăng nhập"
    >
      <section className="demo-login" aria-label="Tài khoản demo">
        <div className="demo-login-heading">
          <div>
            <strong>Đăng nhập nhanh để demo</strong>
            <span>Chọn vai trò, vào hệ thống ngay — không cần nhập mật khẩu.</span>
          </div>
          <span className="demo-login-badge">1 chạm</span>
        </div>
        <div className="demo-account-grid">
          {demoAccounts.map((account) => {
            const Icon = account.icon
            return (
              <button
                className={`demo-account-card ${account.tone}`}
                disabled={demoLoadingId !== null}
                key={account.id}
                onClick={() => void loginDemoAccount(account)}
                title={`${account.label}: ${account.phone} (Mật khẩu: ${account.password})`}
                type="button"
              >
                <span className="demo-account-icon"><Icon aria-hidden="true" /></span>
                <span className="demo-account-copy">
                  <strong>{account.label}</strong>
                  <small>{account.description}</small>
                </span>
                <span className="demo-account-enter" aria-hidden="true">{demoLoadingId === account.id ? <Spin size="small" /> : '→'}</span>
              </button>
            )
          })}
        </div>
        <div className="demo-login-divider"><span>hoặc đăng nhập bằng tài khoản</span></div>
      </section>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        validateTrigger="onSubmit"
      >
        <Form.Item
          label="Số điện thoại"
          name="phone"
          normalize={(value: string) => value?.replace(/\s/g, '')}
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^(0|\+84)[35789][0-9]{8}$/, message: 'Số điện thoại Việt Nam không hợp lệ' }]}
        >
          <Input
            autoComplete="tel"
            inputMode="tel"
            maxLength={12}
            placeholder="0912345678"
            prefix={<PhoneOutlined />}
            size="large"
          />
        </Form.Item>
        <div className="auth-label-row">
          <span>Mật khẩu</span>
          <Button
            className="auth-link-button"
            onClick={() => navigate('/forgot-password')}
            type="link"
          >
            Quên mật khẩu?
          </Button>
        </div>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, max: 50, message: 'Mật khẩu phải từ 6 đến 50 ký tự' }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder="Nhập mật khẩu của bạn"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>
        <Button
          block
          htmlType="submit"
          loading={submitting}
          size="large"
          type="primary"
        >
          Đăng nhập
        </Button>
      </Form>
    </AuthFormCard>
  )
}

function getSafeDestination(role: 'DRIVER' | 'MERCHANT' | 'ADMIN', requested?: string) {
  if (!requested) return getRoleHomePath(role)
  if (role === 'MERCHANT' && requested.startsWith('/merchant')) return requested
  if (role === 'DRIVER' && ['/parking', '/bookings', '/queues', '/payments', '/payment', '/vehicles', '/profile', '/change-password', '/dashboard', '/notifications'].some(path => requested === path || requested.startsWith(`${path}/`) || requested.startsWith(`${path}?`))) return requested
  if (role === 'ADMIN' && requested.startsWith('/admin')) return requested
  return getRoleHomePath(role)
}

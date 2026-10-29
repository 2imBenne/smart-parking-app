import {
  BankOutlined,
  IdcardOutlined,
  LockOutlined,
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  CheckCircleFilled,
} from '@ant-design/icons'
import { Alert, Button, Form, Input, message } from 'antd'
import type { AxiosError } from 'axios'
import { Store, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, sendRegisterOtp } from '../api/authApi'
import type { RegisterRequest, UserRole } from '../types/authTypes'
import { extractApiError } from '../../../shared/api/errors'
import { AuthFormCard } from '../components/AuthFormCard'

const initialValues: Pick<RegisterRequest, 'role'> = {
  role: 'DRIVER',
}

export function RegisterPage() {
  const [form] = Form.useForm<RegisterRequest>()
  const [submitting, setSubmitting] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const navigate = useNavigate()
  const role = Form.useWatch<UserRole>('role', form) ?? 'DRIVER'

  const handleSendOtp = async () => {
    try {
      const phone = await form.validateFields(['phone'])
      setSendingOtp(true)
      const result = await sendRegisterOtp({
        phone: String(phone.phone).replace(/\s/g, ''),
      })
      setOtpSent(true)
      if (result?.otpCode) {
        setDevOtpHint(result.otpCode)
        form.setFieldValue('otpCode', result.otpCode)
      } else {
        setDevOtpHint(null)
      }
      message.success('Đã gửi mã OTP.')
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return
      }
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSendingOtp(false)
    }
  }

  const onFinish = async (values: RegisterRequest) => {
    if (!otpSent) {
      message.warning('Vui lòng gửi và nhập mã OTP trước khi đăng ký.')
      return
    }
    setSubmitting(true)
    try {
      await register({
        ...values,
        phone: values.phone.replace(/\s/g, ''),
        email: values.email.trim(),
        otpCode: values.otpCode.trim(),
        fullName: values.fullName?.trim(),
        citizenId: values.citizenId?.trim(),
        bankName: values.bankName?.trim(),
        bankAccountNum: values.bankAccountNum?.trim(),
      })
      message.success('Đăng ký thành công. Vui lòng đăng nhập.')
      navigate('/login', { replace: true })
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      className="auth-card--register"
      description="Xác thực SĐT bằng OTP, rồi hoàn tất hồ sơ theo vai trò của bạn."
      eyebrow="Create account"
      footer={
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      }
      legal={
        <p>
          Cần tài khoản quản trị? Liên hệ đội vận hành để được cấp quyền.
        </p>
      }
      title="Tạo tài khoản"
    >
      <Form
        className="register-form"
        form={form}
        initialValues={initialValues}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        validateTrigger="onSubmit"
      >
        <section className="register-section">
          <p className="register-section-label">1. Chọn vai trò</p>
          <Form.Item name="role" className="register-role-item">
            <div className="register-role-grid" role="radiogroup" aria-label="Vai trò">
              <button
                type="button"
                role="radio"
                aria-checked={role === 'DRIVER'}
                className={`register-role-card${role === 'DRIVER' ? ' is-active' : ''}`}
                onClick={() => form.setFieldValue('role', 'DRIVER')}
              >
                <span className="register-role-icon driver">
                  <Truck size={20} aria-hidden />
                </span>
                <span className="register-role-copy">
                  <strong>Tài xế / chủ xe</strong>
                  <small>Tìm bãi và đặt chỗ</small>
                </span>
                <CheckCircleFilled
                  className={`register-role-check${role === 'DRIVER' ? ' is-on' : ''}`}
                  aria-hidden
                />
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === 'MERCHANT'}
                className={`register-role-card${role === 'MERCHANT' ? ' is-active' : ''}`}
                onClick={() => form.setFieldValue('role', 'MERCHANT')}
              >
                <span className="register-role-icon merchant">
                  <Store size={20} aria-hidden />
                </span>
                <span className="register-role-copy">
                  <strong>Chủ bãi đỗ</strong>
                  <small>Cấu hình bãi, slot, giá</small>
                </span>
                <CheckCircleFilled
                  className={`register-role-check${role === 'MERCHANT' ? ' is-on' : ''}`}
                  aria-hidden
                />
              </button>
            </div>
          </Form.Item>
        </section>

        <section className="register-section">
          <p className="register-section-label">2. Xác thực số điện thoại</p>
          <Form.Item label="Số điện thoại" required className="register-phone-item">
            <div className="register-phone-row">
              <Form.Item
                name="phone"
                noStyle
                normalize={(value: string) => value?.replace(/\s/g, '')}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    pattern: /^(0|\+84)[35789][0-9]{8}$/,
                    message: 'Số điện thoại Việt Nam không hợp lệ',
                  },
                ]}
              >
                <Input
                  autoComplete="tel"
                  className="register-phone-input"
                  inputMode="tel"
                  maxLength={12}
                  placeholder="0912345678"
                  prefix={<PhoneOutlined />}
                  size="large"
                />
              </Form.Item>
              <Button
                className="register-otp-btn"
                loading={sendingOtp}
                onClick={handleSendOtp}
                size="large"
                type="default"
              >
                {otpSent ? 'Gửi lại' : 'Gửi OTP'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            label="Mã OTP"
            name="otpCode"
            extra={
              otpSent ? (
                <span className="register-otp-hint is-ok">
                  <CheckCircleFilled /> Đã gửi mã — kiểm tra tin nhắn hoặc log server
                </span>
              ) : (
                <span className="register-otp-hint">Nhấn Gửi OTP trước khi tạo tài khoản</span>
              )
            }
            rules={[
              { required: true, message: 'Vui lòng nhập mã OTP' },
              { pattern: /^[0-9]{6}$/, message: 'OTP gồm 6 chữ số' },
            ]}
          >
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Nhập 6 chữ số"
              prefix={<SafetyOutlined />}
              size="large"
            />
          </Form.Item>

          {devOtpHint ? (
            <Alert
              className="register-dev-alert"
              message={`Mã OTP (dev): ${devOtpHint}`}
              showIcon
              type="info"
            />
          ) : null}
        </section>

        <section className="register-section">
          <p className="register-section-label">
            3. Thông tin {role === 'DRIVER' ? 'tài xế' : 'chủ bãi'}
          </p>
          <Form.Item
            label="Email"
            name="email"
            normalize={(value: string) => value?.trim()}
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
              { max: 254, message: 'Email quá dài' },
            ]}
          >
            <Input
              autoComplete="email"
              inputMode="email"
              placeholder="example@gmail.com"
              prefix={<MailOutlined />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, max: 50, message: 'Mật khẩu phải từ 6 đến 50 ký tự' },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>

          {role === 'DRIVER' && (
            <Form.Item
              label="Họ tên tài xế"
              name="fullName"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập họ tên tài xế' },
                { max: 100, message: 'Họ tên không vượt quá 100 ký tự' },
              ]}
            >
              <Input
                autoComplete="name"
                placeholder="Họ và tên"
                prefix={<UserOutlined />}
                size="large"
              />
            </Form.Item>
          )}

          {role === 'MERCHANT' && (
            <>
              <Form.Item
                label="CCCD / CMND"
                name="citizenId"
                rules={[
                  { required: true, message: 'Vui lòng nhập CCCD/CMND' },
                  {
                    pattern: /^(?:[0-9]{9}|[0-9]{12})$/,
                    message: 'CCCD/CMND phải có 9 hoặc 12 chữ số',
                  },
                ]}
              >
                <Input
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="9 hoặc 12 chữ số"
                  prefix={<IdcardOutlined />}
                  size="large"
                />
              </Form.Item>
              <Form.Item
                label="Ngân hàng"
                name="bankName"
                rules={[
                  { required: true, whitespace: true, message: 'Vui lòng nhập tên ngân hàng' },
                  { max: 100, message: 'Tên ngân hàng không vượt quá 100 ký tự' },
                ]}
              >
                <Input
                  placeholder="Vietcombank"
                  prefix={<BankOutlined />}
                  size="large"
                />
              </Form.Item>
              <Form.Item
                label="Số tài khoản"
                name="bankAccountNum"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tài khoản' },
                  { pattern: /^[0-9]{1,30}$/, message: 'Số tài khoản chỉ gồm 1 đến 30 chữ số' },
                ]}
              >
                <Input
                  inputMode="numeric"
                  maxLength={30}
                  placeholder="Số tài khoản ngân hàng"
                  prefix={<BankOutlined />}
                  size="large"
                />
              </Form.Item>
            </>
          )}
        </section>

        <p className="register-admin-note">
          Tài khoản Admin không tự đăng ký — liên hệ vận hành nếu cần quyền quản trị.
        </p>

        <Button
          block
          className="register-submit"
          htmlType="submit"
          loading={submitting}
          size="large"
          type="primary"
        >
          Tạo tài khoản
        </Button>
      </Form>
    </AuthFormCard>
  )
}

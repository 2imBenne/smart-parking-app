import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button, Form, Input, Alert, message } from 'antd'
import { changePassword } from '../api/userApi'
import { ProfileSidebar } from '../components/ProfileSidebar'
type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string }
export function ChangePasswordPage() {
  const [form] = Form.useForm<PasswordForm>()
  const submit = async (values: PasswordForm) => { 
    try { 
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }); 
      message.success('Đổi mật khẩu thành công'); 
      form.resetFields() 
    } catch (error) { 
      message.error(error instanceof Error ? error.message : 'Không thể đổi mật khẩu') 
    } 
  }
  return <main className="profile-page stitch-section"><ProfileSidebar /><section className="profile-content password-content"><header><span>BẢO MẬT TÀI KHOẢN</span><h1>Đổi mật khẩu</h1><p>Mật khẩu demo hiện tại: <strong>Driver@123</strong></p></header><Alert type="info" showIcon message="Chế độ dữ liệu mẫu" description="Form mô phỏng đầy đủ validation; không thay đổi tài khoản backend." /><Form form={form} layout="vertical" onFinish={submit} className="password-form"><Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true }]}><Input.Password prefix={<KeyRound />} /></Form.Item><Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true }, { min: 8, message: 'Tối thiểu 8 ký tự' }, { pattern: /^(?=.*[A-Z])(?=.*\d).+$/, message: 'Cần ít nhất một chữ hoa và một chữ số' }]}><Input.Password prefix={<LockKeyhole />} /></Form.Item><Form.Item name="confirmPassword" label="Xác nhận mật khẩu" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, value) { return value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận không khớp')) } })]}><Input.Password prefix={<ShieldCheck />} /></Form.Item><Button type="primary" htmlType="submit">Cập nhật mật khẩu</Button></Form></section></main>
}

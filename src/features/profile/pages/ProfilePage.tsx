import { Save, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Form, Input, Skeleton, message } from 'antd'
import { useEffect, useState } from 'react'
import { getProfile, updateProfile, type UserProfileDto } from '../api/userApi'
import { ProfileSidebar } from '../components/ProfileSidebar'

export function ProfilePage() {
  const [form] = Form.useForm<UserProfileDto>(); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false)
  useEffect(() => { getProfile().then(data => form.setFieldsValue(data)).finally(() => setLoading(false)) }, [form])
  const submit = async (values: UserProfileDto) => { setSaving(true); try { await updateProfile(values); message.success('Đã lưu hồ sơ') } finally { setSaving(false) } }
  return <main className="profile-page stitch-section"><ProfileSidebar /><section className="profile-content"><header><span>HỒ SƠ DRIVER</span><h1>Thông tin cá nhân</h1><p>Thông tin liên hệ dùng cho booking và hỗ trợ khẩn cấp.</p></header>{loading ? <Skeleton active /> : <><article className="profile-summary"><div className="profile-avatar"><UserRound /></div><div><strong>{form.getFieldValue('fullName')}</strong><span>Tài xế SmartTruck Parking</span></div><em><ShieldCheck /> Đã xác thực</em></article><Form form={form} layout="vertical" onFinish={submit} className="driver-profile-form"><div className="profile-fields"><Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, min: 2 }]}><Input /></Form.Item><Form.Item label="Số điện thoại" name="phone" rules={[{ required: true }, { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số' }]}><Input /></Form.Item><Form.Item label="Email" name="email" rules={[{ type: 'email', required: true }]}><Input /></Form.Item><Form.Item label="Liên hệ khẩn cấp" name="emergencyContact" rules={[{ pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số' }]}><Input /></Form.Item><Form.Item label="Địa chỉ liên hệ" name="address"><Input.TextArea rows={3} /></Form.Item></div><Button type="primary" htmlType="submit" loading={saving} icon={<Save />}>Lưu thay đổi</Button></Form></>}</section></main>
}

import { ReloadOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Form, Input, Skeleton, Tag, Upload, message } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantProfile, updateMerchantProfile, uploadMerchantDocument } from '../api/merchantProfileApi'
import type { MerchantProfile, UpdateMerchantProfileRequest } from '../types/merchantProfileTypes'
import { maskSensitiveValue } from '../utils/maskSensitiveValue'

const verificationColor: Record<string, string> = {
  VERIFIED: 'green',
  PENDING_REVIEW: 'gold',
  INACTIVE: 'default',
  BANNED: 'red',
}

export function MerchantProfilePage() {
  const [form] = Form.useForm<UpdateMerchantProfileRequest>()
  const [docForm] = Form.useForm<{ businessLicense?: string }>()
  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [file, setFile] = useState<File | null>(null)
  const [revealSensitive, setRevealSensitive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const data = await getMerchantProfile()
      setProfile(data)
      form.setFieldsValue({
        fullName: data.fullName ?? undefined,
        email: data.email ?? undefined,
        citizenId: data.citizenId ?? undefined,
        businessLicense: data.businessLicense ?? undefined,
        bankName: data.bankName ?? undefined,
        bankAccountNum: data.bankAccountNum ?? undefined,
        address: data.address ?? undefined,
        emergencyContact: data.emergencyContact ?? undefined,
      })
      docForm.setFieldsValue({ businessLicense: data.businessLicense ?? undefined })
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [docForm, form])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const save = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const updated = await updateMerchantProfile(values)
      setProfile(updated)
      message.success('Đã cập nhật hồ sơ Merchant')
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setSaving(false)
    }
  }

  const uploadDoc = async () => {
    const values = await docForm.validateFields()
    if (!values.businessLicense?.trim() && !file) {
      message.warning('Nhập số giấy phép hoặc chọn file tài liệu')
      return
    }
    setUploading(true)
    try {
      const updated = await uploadMerchantDocument({
        businessLicense: values.businessLicense,
        file,
      })
      setProfile(updated)
      setFile(null)
      message.success('Đã cập nhật giấy tờ')
      form.setFieldValue('businessLicense', updated.businessLicense ?? undefined)
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Hồ sơ Merchant</h1>
          <p>Thông tin pháp lý, liên hệ và tài khoản nhận tiền.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </header>

      {error && <Alert type="error" showIcon message="Không tải được hồ sơ" description={error} />}

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : profile ? (
        <>
          <section className="merchant-detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <Tag color={verificationColor[profile.verificationStatus] ?? 'blue'}>{profile.verificationLabel}</Tag>
              <Button type="link" onClick={() => setRevealSensitive((value) => !value)}>
                {revealSensitive ? 'Ẩn CCCD / số tài khoản' : 'Hiện CCCD / số tài khoản'}
              </Button>
            </div>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Số điện thoại đăng nhập">{profile.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{profile.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Họ tên">{profile.fullName || '—'}</Descriptions.Item>
              <Descriptions.Item label="CCCD/CMND">
                {revealSensitive
                  ? profile.citizenId || '—'
                  : profile.maskedCitizenId || (profile.citizenId ? maskSensitiveValue(profile.citizenId) : '—')}
              </Descriptions.Item>
              <Descriptions.Item label="Giấy phép kinh doanh">{profile.businessLicense || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{profile.bankName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tài khoản ngân hàng">
                {revealSensitive
                  ? profile.bankAccountNum || '—'
                  : profile.maskedBankAccount || (profile.bankAccountNum ? maskSensitiveValue(profile.bankAccountNum) : '—')}
              </Descriptions.Item>
              <Descriptions.Item label="Số dư ví">
                {profile.walletBalance == null
                  ? '—'
                  : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(profile.walletBalance)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái xác minh">{profile.verificationLabel}</Descriptions.Item>
            </Descriptions>
          </section>

          <section className="merchant-detail-card">
            <h2>Cập nhật hồ sơ</h2>
            <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
              <Form.Item name="fullName" label="Họ tên / tên đơn vị">
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item
                name="citizenId"
                label="CCCD/CMND"
                rules={[{ pattern: /^\d{9,12}$/, message: 'CCCD/CMND gồm 9–12 chữ số' }]}
              >
                <Input maxLength={12} />
              </Form.Item>
              <Form.Item name="businessLicense" label="Giấy phép kinh doanh">
                <Input maxLength={50} />
              </Form.Item>
              <Form.Item name="bankName" label="Ngân hàng">
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item
                name="bankAccountNum"
                label="Số tài khoản"
                rules={[{ pattern: /^\d{6,30}$/, message: 'Số tài khoản gồm 6–30 chữ số' }]}
              >
                <Input maxLength={30} />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={2} maxLength={255} />
              </Form.Item>
              <Form.Item name="emergencyContact" label="Liên hệ khẩn cấp">
                <Input maxLength={20} />
              </Form.Item>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void save()}>
                Lưu hồ sơ
              </Button>
            </Form>
          </section>

          <section className="merchant-detail-card">
            <h2>Giấy tờ / tài liệu</h2>
            <Form form={docForm} layout="vertical" style={{ maxWidth: 640 }}>
              <Form.Item name="businessLicense" label="Số giấy phép kinh doanh">
                <Input maxLength={50} placeholder="Nhập hoặc cập nhật số GPKD" />
              </Form.Item>
              <Form.Item label="File đính kèm (PDF/JPEG/PNG, tối đa 5MB)">
                <Upload
                  beforeUpload={(next) => {
                    setFile(next)
                    return false
                  }}
                  onRemove={() => setFile(null)}
                  maxCount={1}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                >
                  <Button icon={<UploadOutlined />}>Chọn file</Button>
                </Upload>
              </Form.Item>
              <Button type="default" icon={<UploadOutlined />} loading={uploading} onClick={() => void uploadDoc()}>
                Gửi giấy tờ
              </Button>
            </Form>
          </section>
        </>
      ) : null}
    </main>
  )
}

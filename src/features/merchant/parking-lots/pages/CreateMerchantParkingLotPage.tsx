import { AimOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Form, Input, InputNumber, Steps, Tag, Upload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import type { AxiosError } from 'axios'
import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractApiError } from '../../../../shared/api/errors'
import { createMerchantParkingLot, uploadMerchantParkingLotImages } from '../api/merchantParkingLotApi'
import type { CreateMerchantParkingLotRequest } from '../types/merchantParkingLotTypes'
import { GenerateDescriptionModal } from '../../../ai-copilot/components/GenerateDescriptionModal'
import { Sparkles } from 'lucide-react'

const ParkingLotMapPicker = lazy(() => import('../components/ParkingLotMapPicker').then(module => ({ default: module.ParkingLotMapPicker })))

export function CreateMerchantParkingLotPage() {
  const [form] = Form.useForm<CreateMerchantParkingLotRequest>()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [images, setImages] = useState<UploadFile[]>([])
  const [createdParkingLotId, setCreatedParkingLotId] = useState<number>()
  const [uploadError, setUploadError] = useState('')
  const [locationAccuracy, setLocationAccuracy] = useState<number>()
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiContent, setAiContent] = useState<{ marketingDescription?: string; regulations?: string; wayfinding?: string } | null>(null)
  const navigate = useNavigate()
  const values = Form.useWatch([], form) as CreateMerchantParkingLotRequest | undefined

  const validateImage: UploadProps['beforeUpload'] = (file) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      message.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.')
      return Upload.LIST_IGNORE
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('Mỗi ảnh không được vượt quá 5 MB.')
      return Upload.LIST_IGNORE
    }
    return false
  }

  const next = async () => {
    const fields: (keyof CreateMerchantParkingLotRequest)[][] = [['name', 'address'], ['latitude', 'longitude']]
    if (step < 2) await form.validateFields(fields[step])
    setStep((current) => Math.min(current + 1, 2))
  }

  const locate = () => {
    if (!navigator.geolocation) { message.error('Trình duyệt không hỗ trợ định vị.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        form.setFieldsValue({ latitude: Number(coords.latitude.toFixed(7)), longitude: Number(coords.longitude.toFixed(7)) })
        setLocationAccuracy(coords.accuracy)
        message.success(`Đã lấy vị trí hiện tại với độ chính xác khoảng ±${Math.round(coords.accuracy)} m.`)
        setLocating(false)
      },
      () => { message.error('Không lấy được vị trí hiện tại. Vui lòng kiểm tra quyền định vị.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const submit = async () => {
    setSubmitting(true)
    setUploadError('')
    let parkingLotId = createdParkingLotId
    try {
      if (!parkingLotId) {
        const request = await form.validateFields()
        const created = await createMerchantParkingLot(request)
        parkingLotId = created.id
        setCreatedParkingLotId(created.id)
      }
      const files = images.flatMap(image => image.originFileObj ? [image.originFileObj as File] : [])
      if (files.length) await uploadMerchantParkingLotImages(parkingLotId, files)
      message.success(files.length ? 'Tạo bãi và upload ảnh thành công.' : 'Tạo bãi thành công. Hồ sơ đang chờ phê duyệt.')
      navigate(`/merchant/parking-lots/${parkingLotId}`, { replace: true })
    } catch (error) {
      const errorMessage = extractApiError(error as AxiosError)
      if (parkingLotId) setUploadError(errorMessage)
      else message.error(errorMessage)
    }
    finally { setSubmitting(false) }
  }

  return <main className="merchant-page-stack merchant-form-page">
    <header className="merchant-page-header"><div><h1>Tạo bãi đỗ mới</h1><p>Thông tin mới sẽ được gửi và chờ quản trị viên phê duyệt.</p></div></header>
    <Steps current={step} items={[{ title: 'Thông tin' }, { title: 'Vị trí' }, { title: 'Xác nhận' }]} />
    <Form form={form} layout="vertical" requiredMark="optional" className="merchant-form-card">
      <section hidden={step !== 0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Thông tin cơ bản</h2>
          <Button
            type="dashed"
            style={{ color: '#0f766e', borderColor: '#0f766e', fontWeight: 500 }}
            onClick={() => setAiModalOpen(true)}
          >
            ✨ Điền nhanh bằng AI
          </Button>
        </div>
        <Form.Item name="name" label="Tên bãi" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên bãi' }]}><Input maxLength={150} placeholder="Ví dụ: Bãi đỗ xe tải Thủ Đức" /></Form.Item>
        <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập địa chỉ' }]}><Input.TextArea rows={3} maxLength={300} placeholder="Nhập địa chỉ đầy đủ" /></Form.Item>
        {aiContent && (
          <div style={{ marginTop: 16, marginBottom: 16, padding: 14, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#0f766e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> Nội dung AI đã sinh & áp dụng thành công
              </span>
              <Button size="small" type="link" danger onClick={() => setAiContent(null)}>
                Xóa
              </Button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
              {aiContent.marketingDescription && (
                <div>
                  <strong style={{ color: '#134e4a' }}>Giới thiệu:</strong> {aiContent.marketingDescription}
                </div>
              )}
              {aiContent.regulations && (
                <div>
                  <strong style={{ color: '#134e4a' }}>Nội quy PCCC:</strong> {aiContent.regulations}
                </div>
              )}
              {aiContent.wayfinding && (
                <div>
                  <strong style={{ color: '#134e4a' }}>Chỉ dẫn đường đi:</strong> {aiContent.wayfinding}
                </div>
              )}
            </div>
          </div>
        )}
        <Form.Item label="Hình ảnh bãi đỗ" extra="Tối đa 5 ảnh JPG, PNG hoặc WebP; mỗi ảnh không quá 5 MB.">
          <Upload
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={validateImage}
            fileList={images}
            listType="picture-card"
            maxCount={5}
            multiple
            onChange={({ fileList }) => setImages(fileList.slice(0, 5))}
          >
            {images.length < 5 && <button type="button" className="ant-upload-text"><PlusOutlined /><span>Thêm ảnh</span></button>}
          </Upload>
        </Form.Item>
        <Alert type="info" showIcon message="Ảnh sẽ được upload sau khi tạo bãi" description="Ảnh đầu tiên được chọn sẽ tự động làm ảnh đại diện của bãi đỗ." />
      </section>
      <section hidden={step !== 1}>
        <div className="merchant-section-title"><div><h2>Vị trí bãi</h2><p>Nhập tọa độ hoặc lấy vị trí hiện tại.</p></div><Button icon={<AimOutlined />} loading={locating} onClick={locate}>Vị trí hiện tại</Button></div>
        <div className="merchant-two-columns">
          <Form.Item name="latitude" label="Latitude" rules={[{ required: true, message: 'Vui lòng nhập latitude' }, { type: 'number', min: -90, max: 90, message: 'Latitude phải từ -90 đến 90' }]}><InputNumber stringMode={false} step={0.0000001} precision={7} min={-90} max={90} onChange={() => setLocationAccuracy(undefined)} /></Form.Item>
          <Form.Item name="longitude" label="Longitude" rules={[{ required: true, message: 'Vui lòng nhập longitude' }, { type: 'number', min: -180, max: 180, message: 'Longitude phải từ -180 đến 180' }]}><InputNumber stringMode={false} step={0.0000001} precision={7} min={-180} max={180} onChange={() => setLocationAccuracy(undefined)} /></Form.Item>
        </div>
        {step === 1 && <Suspense fallback={<div className="merchant-map-loading">Đang tải bản đồ…</div>}><ParkingLotMapPicker latitude={values?.latitude} longitude={values?.longitude} accuracy={locationAccuracy} onChange={(latitude, longitude) => { setLocationAccuracy(undefined); form.setFieldsValue({ latitude, longitude }) }} /></Suspense>}
      </section>
      <section hidden={step !== 2}>
        <h2>Xác nhận thông tin</h2>
        <Descriptions bordered column={1} items={[
          { key: 'name', label: 'Tên bãi', children: values?.name || '—' },
          { key: 'address', label: 'Địa chỉ', children: values?.address || '—' },
          ...(aiContent?.marketingDescription ? [{ key: 'aiDesc', label: 'Mô tả AI', children: aiContent.marketingDescription }] : []),
          { key: 'coordinates', label: 'Tọa độ', children: `${values?.latitude ?? '—'}, ${values?.longitude ?? '—'}` },
          { key: 'images', label: 'Hình ảnh', children: images.length ? `${images.length} ảnh sẽ được upload` : 'Chưa chọn ảnh' },
          { key: 'status', label: 'Trạng thái sau tạo', children: <Tag color="gold">Chờ phê duyệt</Tag> }
        ]} />
        {images.length > 0 && <Upload className="merchant-inline-alert" fileList={images} listType="picture-card" disabled showUploadList={{ showRemoveIcon: false }} />}
        <Alert className="merchant-inline-alert" type="info" showIcon message="Sau khi tạo, bãi đỗ sẽ được gửi đến quản trị viên để phê duyệt." description="Thông tin bãi và các ảnh đã chọn sẽ được lưu trước khi chuyển sang trang chi tiết." />
        {uploadError && <Alert className="merchant-inline-alert" type="error" showIcon message={`Bãi #${createdParkingLotId} đã được tạo nhưng upload ảnh thất bại`} description={uploadError} />}
      </section>
      <footer className="merchant-form-actions">{createdParkingLotId ? <><Button onClick={() => navigate(`/merchant/parking-lots/${createdParkingLotId}`)}>Đến chi tiết bãi</Button><Button type="primary" loading={submitting} disabled={submitting} onClick={() => void submit()}>Thử upload lại</Button></> : <><Button onClick={() => step === 0 ? navigate('/merchant/parking-lots') : setStep((current) => current - 1)}>{step === 0 ? 'Hủy' : 'Quay lại'}</Button>{step < 2 ? <Button type="primary" onClick={() => void next()}>Tiếp tục</Button> : <Button type="primary" loading={submitting} disabled={submitting} onClick={() => void submit()}>Tạo bãi</Button>}</>}</footer>
    </Form>
    <GenerateDescriptionModal
      open={aiModalOpen}
      onClose={() => setAiModalOpen(false)}
      initialName={values?.name}
      initialAddress={values?.address}
      onApply={({ name, address, marketingDescription, regulations, wayfinding }) => {
        const updateValues: Partial<CreateMerchantParkingLotRequest> = {}
        if (name) updateValues.name = name
        if (address) updateValues.address = address
        form.setFieldsValue(updateValues)

        // Clear red validation errors on name & address immediately
        if (name || address) {
          form.validateFields(Object.keys(updateValues) as (keyof CreateMerchantParkingLotRequest)[]).catch(() => {})
        }

        setAiContent({
          marketingDescription,
          regulations,
          wayfinding,
        })
      }}
    />
  </main>
}

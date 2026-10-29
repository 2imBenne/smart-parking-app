import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, Card, message, Checkbox } from 'antd'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { generateParkingDescription, type ParkingDescriptionResponse } from '../api/aiApi'

interface GenerateDescriptionModalProps {
  open: boolean
  onClose: () => void
  initialName?: string
  initialAddress?: string
  onApply: (data: { name?: string; address?: string; marketingDescription?: string; regulations?: string; wayfinding?: string }) => void
}

export const GenerateDescriptionModal: React.FC<GenerateDescriptionModalProps> = ({
  open,
  onClose,
  initialName,
  initialAddress,
  onApply,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParkingDescriptionResponse | null>(null)
  const [savedInputs, setSavedInputs] = useState<{ lotName: string; address: string }>({
    lotName: initialName || '',
    address: initialAddress || '',
  })

  useEffect(() => {
    if (open) {
      const name = initialName || ''
      const addr = initialAddress || ''
      form.setFieldsValue({
        lotName: name,
        address: addr,
      })
      setSavedInputs({
        lotName: name,
        address: addr,
      })
    }
  }, [open, initialName, initialAddress, form])

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setSavedInputs({
        lotName: values.lotName,
        address: values.address,
      })
      setLoading(true)

      const res = await generateParkingDescription({
        lotName: values.lotName,
        address: values.address,
        totalCapacity: values.totalCapacity,
        supportedVehicleTypes: values.vehicleTypes,
        amenities: values.amenities,
        nearbyLandmarks: values.nearbyLandmarks,
      })

      setResult(res)
      message.success('AI đã sinh nội dung bãi xe thành công!')
    } catch {
      message.error('Không thể sinh nội dung. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    const currentValues = form.getFieldsValue()
    const finalName = currentValues.lotName || savedInputs.lotName
    const finalAddress = currentValues.address || savedInputs.address

    onApply({
      name: finalName,
      address: finalAddress,
      marketingDescription: result.marketingDescription,
      regulations: result.operatingRegulations,
      wayfinding: result.wayfindingGuide,
    })
    message.success('Đã áp dụng thông tin và nội dung AI vào hồ sơ bãi xe!')
    onClose()
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-teal-800">
          <Sparkles size={20} className="text-teal-600 animate-spin" />
          <span>Trợ Lý AI Tự Động Sinh Nội Dung & Quy Định Bãi Xe</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        result ? (
          <div className="flex justify-between items-center w-full">
            <Button onClick={() => setResult(null)}>Sinh lại</Button>
            <div className="flex gap-2">
              <Button onClick={onClose}>Đóng</Button>
              <Button
                type="primary"
                className="bg-teal-700 hover:bg-teal-800"
                icon={<CheckCircle2 size={16} />}
                onClick={handleApply}
              >
                Áp dụng vào Form
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              className="bg-teal-700 hover:bg-teal-800"
              icon={<Sparkles size={16} />}
              loading={loading}
              onClick={handleGenerate}
            >
              Sinh Nội Dung AI
            </Button>
          </div>
        )
      }
    >
      <div style={{ display: result ? 'none' : 'block' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            lotName: initialName || '',
            address: initialAddress || '',
            totalCapacity: 50,
            vehicleTypes: ['SEDAN_SUV', 'LIGHT_TRUCK'],
            amenities: ['Camera an ninh 24/7', 'Có mái che', 'Trạm sạc EV'],
          }}
          className="mt-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="lotName"
              label="Tên bãi xe dự kiến"
              rules={[{ required: true, message: 'Vui lòng nhập tên bãi xe' }]}
            >
              <Input placeholder="VD: Bãi Đỗ Xe An Khánh" />
            </Form.Item>
            <Form.Item name="totalCapacity" label="Tổng sức chứa">
              <Input type="number" placeholder="50" />
            </Form.Item>
          </div>

          <Form.Item
            name="address"
            label="Địa chỉ bãi xe"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="VD: 120 Song Hành, P. An Phú, TP. Thủ Đức" />
          </Form.Item>

          <Form.Item name="nearbyLandmarks" label="Mốc địa danh gần đó (giúp AI sinh chỉ đường)">
            <Input placeholder="VD: Cách cầu Sài Gòn 500m, đối diện Metro An Phú" />
          </Form.Item>

          <Form.Item name="amenities" label="Tiện ích bãi xe">
            <Checkbox.Group
              options={[
                { label: 'Camera 24/7', value: 'Camera 24/7' },
                { label: 'Có mái che', value: 'Có mái che' },
                { label: 'Trạm sạc điện EV', value: 'Trạm sạc EV' },
                { label: 'Rửa xe tự động', value: 'Rửa xe' },
                { label: 'Bảo vệ túc trực', value: 'Bảo vệ túc trực' },
              ]}
            />
          </Form.Item>
        </Form>
      </div>

      {result && (
        <div className="space-y-4 my-2 max-h-[460px] overflow-y-auto pr-1">
          <Card size="small" className="border-teal-200 bg-teal-50/30">
            <div className="font-semibold text-teal-800 text-xs mb-1 flex items-center gap-1">
              <Sparkles size={13} /> Đoạn Giới Thiệu Marketing (Chuẩn SEO)
            </div>
            <p className="text-xs text-gray-700 leading-relaxed m-0 whitespace-pre-line">
              {result.marketingDescription}
            </p>
          </Card>

          <Card size="small" className="border-blue-200 bg-blue-50/30">
            <div className="font-semibold text-blue-800 text-xs mb-1">
              📋 Nội Quy Vận Hành & An Toàn PCCC
            </div>
            <p className="text-xs text-gray-700 leading-relaxed m-0 whitespace-pre-line">
              {result.operatingRegulations}
            </p>
          </Card>

          <Card size="small" className="border-amber-200 bg-amber-50/30">
            <div className="font-semibold text-amber-800 text-xs mb-1">
              📍 Hướng Dẫn Đường Đi (Wayfinding Guide)
            </div>
            <p className="text-xs text-gray-700 leading-relaxed m-0 whitespace-pre-line">
              {result.wayfindingGuide}
            </p>
          </Card>
        </div>
      )}
    </Modal>
  )
}

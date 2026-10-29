import { Car, Hash, Pencil, Plus, Scale, Trash2, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Skeleton, message } from 'antd'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { addVehicle, deleteVehicle, getMyVehicles, updateVehicle } from '../api/vehicleApi'
import type { AddVehicleRequest, VehicleDto, VehicleType } from '../types/vehicleTypes'
import { VEHICLE_TYPE_LABELS } from '../types/vehicleTypes'
import { ProfileSidebar } from '../../profile/components/ProfileSidebar'

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<VehicleDto | null>(null)
  const [form] = Form.useForm<AddVehicleRequest>()

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      setVehicles((await getMyVehicles()).content)
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchVehicles)
  }, [])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (vehicle: VehicleDto) => {
    setEditing(vehicle)
    form.setFieldsValue({
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
      weightTon: vehicle.weightTon,
      brandModel: vehicle.brandModel ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: AddVehicleRequest) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        licensePlate: values.licensePlate.trim().toUpperCase(),
        brandModel: values.brandModel?.trim() || null,
      }
      if (editing) await updateVehicle(editing.id, payload)
      else await addVehicle(payload)
      message.success(editing ? 'Cập nhật phương tiện thành công' : 'Thêm phương tiện thành công')
      closeModal()
      await fetchVehicles()
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteVehicle(id)
      message.success('Đã xóa phương tiện')
      await fetchVehicles()
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    }
  }

  return (
    <main className="vehicles-stitch-page stitch-section">
      <ProfileSidebar />
      <section className="vehicles-stitch-content">
        <div className="vehicles-stitch-heading">
          <h1>Phương tiện của tôi</h1>
          <button onClick={openCreate}>
            <Plus /> Thêm phương tiện
          </button>
        </div>
        <div className="vehicles-stitch-table">
          <div className="vehicles-stitch-header">
            <span>BIỂN SỐ</span>
            <span>LOẠI XE</span>
            <span>TRẠNG THÁI</span>
            <span>THAO TÁC</span>
          </div>
          {loading ? (
            <div className="vehicle-stitch-row">
              <Skeleton active />
            </div>
          ) : vehicles.length === 0 ? (
            <Empty description="Bạn chưa có phương tiện" />
          ) : (
            vehicles.map((vehicle) => (
              <div className="vehicle-stitch-row" key={vehicle.id}>
                <strong>
                  {vehicle.licensePlate}
                  {vehicle.brandModel ? <small className="vehicle-brand-model">{vehicle.brandModel}</small> : null}
                </strong>
                <span>
                  {VEHICLE_TYPE_LABELS[vehicle.vehicleType]} ({vehicle.weightTon} tấn)
                </span>
                <em className={vehicle.status === 'ACTIVE' ? 'active' : ''}>
                  {vehicle.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </em>
                <span className="vehicle-actions">
                  <button onClick={() => openEdit(vehicle)} aria-label="Sửa phương tiện">
                    <Pencil />
                  </button>
                  <Popconfirm
                    title="Xóa phương tiện?"
                    description={`Xóa xe ${vehicle.licensePlate} khỏi tài khoản?`}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(vehicle.id)}
                  >
                    <button aria-label="Xóa phương tiện">
                      <Trash2 />
                    </button>
                  </Popconfirm>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        closable={false}
        width={650}
        centered
        className="vehicle-stitch-modal"
        destroyOnHidden
      >
        <div className="vehicle-modal-title">
          <h2>{editing ? 'Cập nhật phương tiện' : 'Thêm phương tiện mới'}</h2>
          <button onClick={closeModal} aria-label="Đóng">
            <X />
          </button>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="vehicle-form">
          <div className="vehicle-form-grid">
            <Form.Item
              label="BIỂN SỐ XE"
              name="licensePlate"
              normalize={(value: string) => value?.toUpperCase()}
              rules={[
                { required: true, message: 'Vui lòng nhập biển số xe' },
                { pattern: /^[0-9A-Z.-]{5,20}$/i, message: 'Biển số không hợp lệ' },
              ]}
            >
              <Input prefix={<Hash />} placeholder="VD: 51C-123.45" />
            </Form.Item>
            <Form.Item label="LOẠI XE" name="vehicleType" rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}>
              <Select
                suffixIcon={<Truck />}
                placeholder="Chọn loại xe"
                options={(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((value) => ({
                  value,
                  label: VEHICLE_TYPE_LABELS[value],
                }))}
              />
            </Form.Item>
            <Form.Item label="TẢI TRỌNG (TẤN)" name="weightTon" rules={[{ required: true, message: 'Vui lòng nhập tải trọng' }]}>
              <InputNumber prefix={<Scale />} min={0.1} max={100} step={0.1} />
            </Form.Item>
            <Form.Item
              label="NHÃN HIỆU / MODEL"
              name="brandModel"
              rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}
              extra="Không bắt buộc. VD: Hino 300, Hyundai Mighty"
            >
              <Input prefix={<Car />} placeholder="VD: Hino 300" maxLength={100} allowClear />
            </Form.Item>
          </div>
          <div className="vehicle-modal-actions">
            <Button onClick={closeModal}>Hủy bỏ</Button>
            <Button htmlType="submit" loading={submitting} className="vehicle-add-button">
              {editing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </main>
  )
}

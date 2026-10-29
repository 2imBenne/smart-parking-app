import { Alert, Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'

export type CancelBookingFormValues = {
  reason: string
  contactPhone: string
  preferredResolution: string
  note?: string
}

const REASON_OPTIONS = [
  { value: 'Đổi lịch trình / không kịp đến bãi', label: 'Đổi lịch trình / không kịp đến bãi' },
  { value: 'Đặt nhầm bãi / nhầm loại xe', label: 'Đặt nhầm bãi / nhầm loại xe' },
  { value: 'Sự cố phương tiện', label: 'Sự cố phương tiện' },
  { value: 'Lý do cá nhân khác', label: 'Lý do cá nhân khác' },
]

const RESOLUTION_OPTIONS = [
  {
    value: 'Hoàn tiền cọc về cổng thanh toán PayOS',
    label: 'Hoàn tiền cọc về cổng thanh toán PayOS',
  },
  {
    value: 'Hoàn tiền về số tài khoản ngân hàng (ghi STK ở ghi chú)',
    label: 'Hoàn tiền về số tài khoản ngân hàng (ghi STK ở ghi chú)',
  },
  {
    value: 'Chỉ hủy slot, không yêu cầu hoàn tiền',
    label: 'Chỉ hủy slot, không yêu cầu hoàn tiền',
  },
  {
    value: 'Cần Admin/Merchant liên hệ hỗ trợ thủ công',
    label: 'Cần Admin/Merchant liên hệ hỗ trợ thủ công',
  },
]

type Props = {
  open: boolean
  loading?: boolean
  bookingCode?: string
  paidDeposit?: boolean
  defaultPhone?: string
  onCancel: () => void
  onSubmit: (values: CancelBookingFormValues) => void | Promise<void>
}

export function CancelBookingModal({
  open,
  loading,
  bookingCode,
  paidDeposit,
  defaultPhone,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<CancelBookingFormValues>()

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      contactPhone: defaultPhone || '',
      preferredResolution: paidDeposit
        ? 'Hoàn tiền cọc về cổng thanh toán PayOS'
        : 'Chỉ hủy slot, không yêu cầu hoàn tiền',
      reason: undefined,
      note: undefined,
    })
  }, [open, defaultPhone, paidDeposit, form])

  return (
    <Modal
      open={open}
      title="Hủy đặt chỗ & yêu cầu xử lý"
      okText={paidDeposit ? 'Hủy chỗ & gửi yêu cầu hoàn tiền' : 'Xác nhận hủy chỗ'}
      cancelText="Đóng"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={560}
    >
      <Alert
        type={paidDeposit ? 'warning' : 'info'}
        showIcon
        style={{ marginBottom: 16 }}
        message={paidDeposit ? 'Booking đã thanh toán cọc' : 'Booking chưa thanh toán cọc'}
        description={
          paidDeposit
            ? `Mã ${bookingCode ?? ''}: sau khi gửi form, hệ thống hủy slot, ghi nhận hoàn cọc và tạo ticket hỗ trợ theo hướng bạn chọn. Chỉ áp dụng trong 1 giờ sau khi đặt.`
            : `Mã ${bookingCode ?? ''}: hủy sẽ trả slot về bãi. Không phát sinh hoàn tiền. Chỉ hủy được trong 1 giờ sau khi đặt.`
        }
      />
      <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark>
        <Form.Item
          label="Lý do hủy"
          name="reason"
          rules={[{ required: true, message: 'Vui lòng chọn lý do hủy' }]}
        >
          <Select options={REASON_OPTIONS} placeholder="Chọn lý do" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại liên hệ"
          name="contactPhone"
          rules={[
            { required: true, message: 'Vui lòng nhập SĐT' },
            { pattern: /^0\d{9,10}$/, message: 'SĐT 10–11 số, bắt đầu bằng 0' },
          ]}
        >
          <Input placeholder="VD: 0909128374" maxLength={11} />
        </Form.Item>
        <Form.Item
          label="Hướng giải quyết mong muốn"
          name="preferredResolution"
          rules={[{ required: true, message: 'Vui lòng chọn hướng giải quyết' }]}
        >
          <Select options={RESOLUTION_OPTIONS} placeholder="Chọn hướng xử lý" />
        </Form.Item>
        <Form.Item label="Ghi chú thêm (STK / chi tiết)" name="note">
          <Input.TextArea rows={3} maxLength={1000} placeholder="VD: Ngân hàng Vietcombank - STK 0123456789 - Nguyễn Văn A" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

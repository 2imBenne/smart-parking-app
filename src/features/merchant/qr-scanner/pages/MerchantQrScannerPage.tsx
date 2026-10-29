import { CheckCircleOutlined, QrcodeOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Descriptions, Input, Modal, Radio, Select, Skeleton, message } from 'antd'
import type { AxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantParkingLots } from '../../parking-lots/api/merchantParkingLotApi'
import type { MerchantParkingLotListItem } from '../../parking-lots/types/merchantParkingLotTypes'
import { confirmCashPayment, merchantCheckIn, merchantCheckOut } from '../api/merchantQrApi'
import { QrCameraScanner } from '../components/QrCameraScanner'
import type { CheckOutResponse, MerchantQrMode } from '../types/merchantQrTypes'

export function MerchantQrScannerPage() {
  const [mode, setMode] = useState<MerchantQrMode>('CHECK_IN')
  const [bookingCode, setBookingCode] = useState('')
  const [parkingLotId, setParkingLotId] = useState<number>()
  const [lots, setLots] = useState<MerchantParkingLotListItem[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cashSubmitting, setCashSubmitting] = useState(false)
  const [checkout, setCheckout] = useState<CheckOutResponse | null>(null)
  const lastSubmission = useRef<{ code: string; at: number } | null>(null)

  useEffect(() => {
    let active = true
    void getMerchantParkingLots({ page: 0, size: 100, sort: 'name,asc' })
      .then((page) => {
        if (!active) return
        const approved = page.content.filter((lot) => lot.status === 'APPROVED')
        setLots(approved.length ? approved : page.content)
        setParkingLotId((current) => current ?? approved[0]?.id ?? page.content[0]?.id)
      })
      .catch((error) => message.error(extractApiError(error as AxiosError)))
      .finally(() => {
        if (active) setLoadingLots(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selectedLot = lots.find((lot) => lot.id === parkingLotId)

  const submit = async () => {
    const code = bookingCode.trim()
    if (!parkingLotId) {
      message.warning('Vui lòng chọn bãi đỗ đang vận hành.')
      return
    }
    if (!code) {
      message.warning('Vui lòng quét hoặc nhập booking code.')
      return
    }
    const last = lastSubmission.current
    if (last?.code === code && Date.now() - last.at < 3000) {
      message.warning('Mã này vừa được gửi. Vui lòng chờ trước khi thử lại.')
      return
    }
    setSubmitting(true)
    setCheckout(null)
    lastSubmission.current = { code, at: Date.now() }
    try {
      if (mode === 'CHECK_IN') {
        await merchantCheckIn({ bookingCode: code, parkingLotId })
        message.success('Check-in thành công.')
      } else {
        const result = await merchantCheckOut({ bookingCode: code, parkingLotId })
        setCheckout(result)
        message.success('Check-out thành công.')
      }
      setBookingCode('')
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmCash = () => {
    if (!checkout || !parkingLotId) return
    Modal.confirm({
      title: 'Xác nhận thu tiền mặt',
      content: `Xác nhận tài xế đã thanh toán ${formatMoney(checkout.amountDue)} bằng tiền mặt tại cổng? Lượt đỗ sẽ hoàn tất và mở barie ngay.`,
      okText: 'Xác nhận đã nhận tiền',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        setCashSubmitting(true)
        try {
          const res = await confirmCashPayment({
            bookingCode: checkout.bookingCode,
            parkingLotId,
          })
          setCheckout(res)
          message.success('Đã xác nhận thu tiền mặt & hoàn tất check-out thành công!')
        } catch (err) {
          message.error(extractApiError(err as AxiosError))
        } finally {
          setCashSubmitting(false)
        }
      },
    })
  }

  const confirm = () => {
    const code = bookingCode.trim()
    if (!parkingLotId) {
      message.warning('Vui lòng chọn bãi đỗ đang vận hành.')
      return
    }
    if (!code) {
      message.warning('Vui lòng quét hoặc nhập booking code.')
      return
    }
    Modal.confirm({
      title: mode === 'CHECK_IN' ? 'Xác nhận check-in' : 'Xác nhận check-out',
      content: `Bãi: ${selectedLot?.name ?? parkingLotId}. Booking: ${code}. Hệ thống chỉ chấp nhận mã thuộc đúng bãi này.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: submit,
    })
  }

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Quét QR check-in/check-out</h1>
          <p>Chọn đúng bãi đang vận hành, rồi quét camera hoặc nhập booking code.</p>
        </div>
      </header>
      <Alert
        type="info"
        showIcon
        message="Bắt buộc khớp bãi"
        description="Mã QR của bãi khác sẽ bị từ chối, kể cả khi bạn cũng sở hữu bãi đó."
      />
      <section className="merchant-qr-grid">
        <QrCameraScanner disabled={submitting} onDecoded={setBookingCode} />
        <section className="merchant-scanner-card">
          <h2>
            <QrcodeOutlined /> Xử lý mã
          </h2>
          {loadingLots ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : lots.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="Chưa có bãi đỗ"
              description="Tạo bãi và chờ Admin duyệt trước khi quét QR check-in."
            />
          ) : (
            <>
              <label>
                Bãi đang vận hành
                <Select
                  value={parkingLotId}
                  placeholder="Chọn bãi đỗ"
                  options={lots.map((lot) => ({
                    value: lot.id,
                    label: `${lot.name}${lot.status !== 'APPROVED' ? ` (${lot.status})` : ''}`,
                  }))}
                  onChange={setParkingLotId}
                  showSearch
                  optionFilterProp="label"
                />
              </label>
              {!parkingLotId && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Chọn bãi trước khi xác nhận"
                  description="Camera vẫn bật được; chỉ bước xác nhận check-in/out cần chọn bãi."
                />
              )}
              <label>
                Chế độ
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as MerchantQrMode)}
                  options={[
                    { label: 'Check-in', value: 'CHECK_IN' },
                    { label: 'Check-out', value: 'CHECK_OUT' },
                  ]}
                />
              </label>
              <label>
                Booking code
                <Input
                  value={bookingCode}
                  maxLength={100}
                  onChange={(event) => setBookingCode(event.target.value)}
                  onPressEnter={confirm}
                  placeholder="Quét QR hoặc nhập mã booking"
                />
              </label>
              <Button
                type="primary"
                block
                icon={<SendOutlined />}
                loading={submitting}
                disabled={submitting || !bookingCode.trim() || !parkingLotId}
                onClick={confirm}
              >
                Xác nhận {mode === 'CHECK_IN' ? 'check-in' : 'check-out'}
              </Button>
              <Alert
                type="info"
                showIcon
                message={
                  mode === 'CHECK_IN'
                    ? 'Chỉ booking PENDING_CHECKIN của đúng bãi đã chọn.'
                    : 'Chỉ booking PARKING/OVERTIME của đúng bãi đã chọn.'
                }
              />
            </>
          )}
        </section>
      </section>
      {checkout && (
        <section className="merchant-detail-card merchant-success-card">
          <h2>
            <CheckCircleOutlined /> Kết quả check-out
          </h2>
          <Descriptions
            bordered
            column={{ xs: 1, sm: 2 }}
            items={[
              { key: 'code', label: 'Booking', children: checkout.bookingCode },
              { key: 'minutes', label: 'Thời gian đỗ', children: `${checkout.parkingMinutes} phút` },
              { key: 'total', label: 'Tổng tiền', children: formatMoney(checkout.totalAmount) },
              { key: 'deposit', label: 'Đã cọc', children: formatMoney(checkout.advanceDeposit) },
              { key: 'due', label: 'Còn phải trả', children: formatMoney(checkout.amountDue) },
            ]}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {checkout.amountDue > 0 && (
              <Button type="primary" loading={cashSubmitting} onClick={handleConfirmCash}>
                Xác nhận đã thu tiền mặt ({formatMoney(checkout.amountDue)})
              </Button>
            )}
            <Button onClick={() => setCheckout(null)}>Quét lượt tiếp theo</Button>
          </div>
        </section>
      )}
    </main>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

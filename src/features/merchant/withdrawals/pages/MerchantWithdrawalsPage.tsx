import { DollarOutlined, ReloadOutlined, SendOutlined, WalletOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Form, Input, InputNumber, Modal, Statistic, Table, Tag, message } from 'antd'
import type { TableColumnsType } from 'antd'
import type { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { extractApiError } from '../../../../shared/api/errors'
import { getMerchantRevenue } from '../../../dashboard/api/merchantDashboardApi'
import { createWithdrawal, getMyWithdrawals } from '../api/merchantWithdrawalApi'
import type { CreateWithdrawalRequest, WithdrawalResponse, WithdrawalStatus } from '../types/merchantWithdrawalTypes'

const statusMeta: Record<WithdrawalStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'gold' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  PAID: { label: 'Đã chi', color: 'blue' },
}

export function MerchantWithdrawalsPage() {
  const [form] = Form.useForm<CreateWithdrawalRequest>()
  const [submitting, setSubmitting] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState<number>(100000)
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(5)
  const [history, setHistory] = useState<WithdrawalResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const [revenue, withdrawals] = await Promise.all([
        getMerchantRevenue(),
        getMyWithdrawals(0, 20),
      ])
      setWalletBalance(revenue.walletBalance ?? null)
      if (revenue.minWithdrawalAmount != null) setMinWithdrawalAmount(revenue.minWithdrawalAmount)
      if (revenue.platformFeePercent != null) setPlatformFeePercent(revenue.platformFeePercent)
      setHistory(withdrawals.content)
    } catch (requestError) {
      setError(extractApiError(requestError as AxiosError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const submit = async (values: CreateWithdrawalRequest) => {
    setSubmitting(true)
    try {
      await createWithdrawal(values)
      message.success('Yêu cầu rút tiền đã được ghi nhận.')
      form.resetFields()
      await load()
    } catch (requestError) {
      message.error(extractApiError(requestError as AxiosError))
    } finally {
      setSubmitting(false)
    }
  }

  const confirm = async () => {
    const values = await form.validateFields()
    if (walletBalance != null && values.amount > walletBalance) {
      message.error('Số tiền vượt quá số dư ví hiện có')
      return
    }
    if (values.amount < minWithdrawalAmount) {
      message.error(`Số tiền rút tối thiểu là ${formatMoney(minWithdrawalAmount)}`)
      return
    }
    Modal.confirm({
      title: 'Xác nhận yêu cầu rút tiền',
      content: `Số tiền: ${formatMoney(values.amount)}. Hệ thống sẽ kiểm tra lại số dư trước khi ghi nhận yêu cầu.`,
      okText: 'Gửi yêu cầu',
      cancelText: 'Hủy',
      onOk: () => submit(values),
    })
  }

  const columns: TableColumnsType<WithdrawalResponse> = [
    { title: 'Mã', dataIndex: 'id', key: 'id', width: 90, render: (id: number) => `#${id}` },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (value: number) => formatMoney(value) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: WithdrawalStatus) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag>,
    },
    {
      title: 'Tài khoản nhận',
      key: 'bank',
      render: (_, r) => (r.bankName ? `${r.bankName} - ${r.maskedBankAccount ?? ''}` : '—'),
    },
    {
      title: 'Thời gian',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (value?: string) => (value ? formatDateTime(value) : '—'),
    },
  ]

  return (
    <main className="merchant-page-stack">
      <header className="merchant-page-header">
        <div>
          <h1>Ví và rút tiền</h1>
          <p>Tạo yêu cầu rút doanh thu về tài khoản ngân hàng đã đăng ký.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Tải lại
        </Button>
      </header>

      {error && (
        <Alert type="error" showIcon message="Không tải được dữ liệu ví" description={error} />
      )}

      <section className="merchant-withdrawal-grid">
        <article className="merchant-detail-card">
          <Statistic
            title="Số dư khả dụng"
            value={walletBalance == null ? undefined : walletBalance}
            prefix={<WalletOutlined />}
            formatter={(value) => (value == null ? '—' : formatMoney(Number(value)))}
            loading={loading}
          />
          <p>
            Số dư là tiền net sau phí hệ thống {platformFeePercent}%. Rút tối thiểu{' '}
            {formatMoney(minWithdrawalAmount)}. Admin duyệt rồi chuyển khoản thủ công.
          </p>
        </article>
        <article className="merchant-detail-card">
          <h2>Tạo yêu cầu</h2>
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="Số tiền"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền' },
                { type: 'number', min: minWithdrawalAmount, message: `Tối thiểu ${formatMoney(minWithdrawalAmount)}` },
              ]}
            >
              <InputNumber<number>
                min={minWithdrawalAmount}
                max={walletBalance ?? undefined}
                precision={0}
                addonAfter="VND"
                prefix={<DollarOutlined />}
                formatter={(value) => `${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number((value ?? '').replace(/\./g, ''))}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="bankName" label="Ngân hàng thụ hưởng" rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng' }]}>
              <Input placeholder="Ví dụ: Vietcombank, Techcombank, MB Bank..." />
            </Form.Item>
            <Form.Item name="bankAccountNumber" label="Số tài khoản ngân hàng" rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}>
              <Input placeholder="Ví dụ: 1903678912345" />
            </Form.Item>
            <Form.Item name="accountHolderName" label="Tên chủ tài khoản" rules={[{ required: true, message: 'Vui lòng nhập họ tên chủ tài khoản' }]}>
              <Input placeholder="Ví dụ: NGUYEN VAN A" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <Button type="primary" block icon={<SendOutlined />} loading={submitting} disabled={submitting || loading} onClick={() => void confirm()}>
              Gửi yêu cầu
            </Button>
          </Form>
        </article>
      </section>

      <section className="merchant-detail-card">
        <h2>Lịch sử rút tiền</h2>
        <Table<WithdrawalResponse>
          rowKey="id"
          columns={columns}
          dataSource={history}
          loading={loading}
          pagination={false}
          locale={{ emptyText: <Empty description="Chưa có yêu cầu rút tiền" /> }}
        />
      </section>
    </main>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

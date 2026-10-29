export type CreateWithdrawalRequest = {
  amount: number
  bankName?: string
  bankAccountNumber?: string
  accountHolderName?: string
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'

export type WithdrawalResponse = {
  id: number
  amount: number
  status: WithdrawalStatus
  requestedAt?: string
  availableBalance?: number
  bankName?: string
  maskedBankAccount?: string
  decisionReason?: string | null
}

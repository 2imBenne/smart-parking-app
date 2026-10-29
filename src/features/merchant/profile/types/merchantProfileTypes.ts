export type MerchantAccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED'

export type MerchantProfile = {
  merchantId: number
  userId: number
  fullName?: string | null
  phone: string
  email?: string | null
  citizenId?: string | null
  maskedCitizenId?: string | null
  businessLicense?: string | null
  bankName?: string | null
  bankAccountNum?: string | null
  maskedBankAccount?: string | null
  walletBalance?: number
  accountStatus: MerchantAccountStatus
  verificationStatus: string
  verificationLabel: string
  address?: string | null
  emergencyContact?: string | null
}

export type UpdateMerchantProfileRequest = {
  fullName?: string
  email?: string
  citizenId?: string
  businessLicense?: string
  bankName?: string
  bankAccountNum?: string
  address?: string
  emergencyContact?: string
}

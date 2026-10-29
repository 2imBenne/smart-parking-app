export type UserRole = 'DRIVER' | 'MERCHANT' | 'ADMIN'

export type LoginRequest = {
  phone: string
  password: string
}

export type RegisterRequest = {
  phone: string
  email: string
  password: string
  otpCode: string
  role: Exclude<UserRole, 'ADMIN'>
  fullName?: string
  citizenId?: string
  bankName?: string
  bankAccountNum?: string
}

export type SendOtpRequest = {
  phone: string
}

export type SendOtpResponse = {
  expiresInSeconds: number
  otpCode?: string | null
}

export type AuthResponse = {
  token: string
  role: UserRole
}

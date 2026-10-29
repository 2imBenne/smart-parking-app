import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/api/types'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SendOtpRequest,
  SendOtpResponse,
} from '../types/authTypes'

export async function login(request: LoginRequest) {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/login',
    request,
  )
  return response.data.data
}

export async function sendRegisterOtp(request: SendOtpRequest) {
  const response = await apiClient.post<ApiResponse<SendOtpResponse>>(
    '/api/v1/auth/otp/send',
    request,
  )
  return response.data.data
}

export async function register(request: RegisterRequest) {
  const response = await apiClient.post<ApiResponse<null>>(
    '/api/v1/auth/register',
    request,
  )
  return response.data
}

export async function sendForgotPasswordOtp(request: { email: string }) {
  const response = await apiClient.post<ApiResponse<SendOtpResponse>>(
    '/api/v1/auth/forgot-password/otp',
    request,
  )
  return response.data.data
}

export async function resetPasswordWithOtp(request: {
  email: string
  otpCode: string
  newPassword: string
}) {
  const response = await apiClient.post<ApiResponse<null>>(
    '/api/v1/auth/forgot-password/reset',
    request,
  )
  return response.data
}

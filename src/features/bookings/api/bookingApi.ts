import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse, PageResponse } from '../../../shared/api/types'
import type { BookingDto, CreateBookingRequest } from '../types/bookingTypes'

export type BookingPage = PageResponse<BookingDto>

export const createBooking = async (request: CreateBookingRequest) => {
  const response = await apiClient.post<ApiResponse<BookingDto>>('/api/v1/bookings', request)
  return response.data.data
}

export const payDeposit = async (
  bookingId: number,
  amount?: number,
  merchantId?: number,
  parkingLotId?: number,
) => {
  const response = await apiClient.post<ApiResponse<string>>('/api/v1/payments', {
    bookingId,
    paymentType: 'DEPOSIT',
    amount,
    merchantId,
    parkingLotId,
  })
  return response.data.data
}

export const payFinal = async (bookingId: number) => {
  const response = await apiClient.post<ApiResponse<string>>('/api/v1/payments', { bookingId, paymentType: 'FINAL_PAYMENT' })
  return response.data.data
}

export type PaymentSyncResult = {
  id: number
  bookingId?: number
  status: string
  gateway?: string
  amount?: number
}

export const confirmDemoDeposit = async (
  bookingId: number,
  amount?: number,
  merchantId?: number,
  parkingLotId?: number,
): Promise<PaymentSyncResult> => {
  const response = await apiClient.post<ApiResponse<PaymentSyncResult>>('/api/v1/payments/demo-confirm', {
    bookingId,
    amount,
    merchantId,
    parkingLotId,
  })
  return response.data.data
}

export const syncPayOSPayment = async (payload: {
  orderCode?: number
  bookingId?: number
  paymentLinkId?: string
}): Promise<PaymentSyncResult> => {
  const response = await apiClient.post<ApiResponse<PaymentSyncResult>>('/api/v1/payments/sync', payload)
  return response.data.data
}

export const getMyBookings = async (page = 0, size = 20) => {
  const response = await apiClient.get<ApiResponse<BookingPage>>('/api/v1/bookings', { params: { page, size } })
  return response.data.data
}

export const cancelBooking = async (
  bookingId: number,
  request: {
    reason: string
    contactPhone: string
    preferredResolution: string
    note?: string
  },
) => {
  const response = await apiClient.post<
    ApiResponse<{
      bookingId: number
      bookingCode: string
      status: string
      refundRequested: boolean
      refundAmount: number
      refundStatus: string | null
      disputeId: number | null
      message: string
    }>
  >(`/api/v1/bookings/${bookingId}/cancel`, request)
  return response.data
}

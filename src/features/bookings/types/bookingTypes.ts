import type { VehicleType } from '../../vehicles/types/vehicleTypes'

export type BookingStatus = 'PENDING_PAYMENT' | 'PENDING_CHECKIN' | 'PARKING' | 'OVERTIME' | 'AWAITING_FINAL_PAYMENT' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REVIEWED'

export type BookingDto = {
  id: number
  bookingCode: string
  driverId: number
  driverName: string
  driverPhone?: string | null
  vehicleId: number
  vehicleLicensePlate?: string
  vehiclePlate?: string
  parkingLotId: number
  parkingLotName: string
  parkingLotAddress?: string
  merchantId?: number
  hourlyRate?: number
  vehicleType: VehicleType
  status: BookingStatus
  advanceDeposit: number
  totalAmount: number
  expectedCheckInTime: string
  expectedCheckOutTime: string
  expiresAt: string
  checkInTime: string | null
  checkOutTime: string | null
  createdAt?: string | null
  cancelDeadlineAt?: string | null
  canCancel?: boolean | null
  qrCode?: string
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
}

export type CreateBookingRequest = {
  vehicleId: number
  parkingLotId: number
  vehicleType: VehicleType
  expectedCheckInTime: string
  expectedCheckOutTime: string
  vehiclePlate?: string
  parkingLotName?: string
  parkingLotAddress?: string
  merchantId?: number
  totalAmount?: number
  advanceDeposit?: number
}
export type CreatePaymentLinkResponse = { checkoutUrl: string; orderCode: number; amount: number }

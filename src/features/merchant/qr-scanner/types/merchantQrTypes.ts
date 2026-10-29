export type MerchantQrMode = 'CHECK_IN' | 'CHECK_OUT'

export type CheckInRequest = {
  bookingCode: string
  parkingLotId: number
}

export type CheckOutResponse = {
  bookingCode: string
  totalAmount: number
  advanceDeposit: number
  amountDue: number
  parkingMinutes: number
  bookingStatus?: string
}

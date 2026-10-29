import type { VehicleType } from '../../../vehicles/types/vehicleTypes'

export type ParkingLotStatus = 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export type MerchantSlot = {
  id: number
  vehicleType: VehicleType
  totalCapacity: number
  availableCapacity: number
}

export type MerchantPricingRule = {
  id: number
  vehicleType: VehicleType
  basePricePerHour: number
  surgeMultiplier: number
  surgeStartTime?: string | null
  surgeEndTime?: string | null
  overtimePenaltyMultiplier: number
}

export type MerchantParkingLot = {
  id: number
  merchantId: number
  merchantName: string
  name: string
  address: string
  latitude: number
  longitude: number
  status: ParkingLotStatus
  reviewReason?: string
  ratingAverage: number | null
  slots: MerchantSlot[]
  pricingRules: MerchantPricingRule[]
  images?: ParkingLotImage[]
}

export type MerchantParkingLotListItem = {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  status: ParkingLotStatus
  ratingAverage: number | null
  createdAt: string
}

export type MerchantParkingLotPage = {
  content: MerchantParkingLotListItem[]
  currentPage: number
  totalPages: number
  totalElements: number
}

export type ParkingLotImage = {
  id: number
  parkingLotId: number
  originalFileName: string
  contentType: string
  sizeBytes: number
  cover: boolean
  contentUrl: string
  createdAt: string
}

export type MerchantParkingLotListParams = {
  page: number
  size: number
  status?: ParkingLotStatus
  keyword?: string
  sort: string
}

export type CreateMerchantParkingLotRequest = {
  name: string
  address: string
  latitude: number
  longitude: number
}


export type ConfigureSlotRequest = {
  vehicleType: VehicleType
  totalCapacity: number
}

export type BulkSlotConfigRequest = {
  slots: ConfigureSlotRequest[]
}

export type ConfigurePricingRequest = {
  vehicleType: VehicleType
  basePricePerHour: number
  surgeMultiplier: number
  surgeStartTime?: string | null
  surgeEndTime?: string | null
  overtimePenaltyMultiplier: number
}

export type BulkPricingRuleRequest = {
  pricingRules: ConfigurePricingRequest[]
}

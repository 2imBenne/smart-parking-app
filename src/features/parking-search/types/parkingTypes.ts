import type { VehicleType } from '../../vehicles/types/vehicleTypes'

export type ParkingLotStatus = 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export type SlotDto = {
  id: number
  vehicleType: VehicleType
  totalCapacity: number
  availableCapacity: number
}

export type PricingRuleDto = {
  id: number
  vehicleType: VehicleType
  basePricePerHour: number
  surgeMultiplier: number
  surgeStartTime?: string | null
  surgeEndTime?: string | null
  overtimePenaltyMultiplier: number
}

export type ParkingLotImageDto = {
  id: number
  parkingLotId: number
  originalFileName?: string
  contentType?: string
  sizeBytes?: number
  cover: boolean
  contentUrl: string
  createdAt?: string
}

export type ParkingLotDto = {
  id: number
  merchantId: number
  merchantName: string
  name: string
  address: string
  latitude: number
  longitude: number
  status: ParkingLotStatus
  ratingAverage: number
  slots: SlotDto[]
  pricingRules: PricingRuleDto[]
  distanceKm?: number
  etaMinutes?: number
  description?: string
  amenities?: string[]
  images?: ParkingLotImageDto[]
}

export type ParkingLotSearchResponse = {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  availableCapacity: number
  basePricePerHour: number | null
  averageRating: number
  distanceKm?: number | null
}

import { apiClient } from '../../../shared/api/apiClient'
import { env } from '../../../app/env'
import type { VehicleType } from '../../vehicles/types/vehicleTypes'
import type { ApiResponse } from '../../../shared/api/types'
import type { ParkingLotDto, ParkingLotImageDto, ParkingLotSearchResponse } from '../types/parkingTypes'

export type ParkingSearchInput = {
  vehicleType: VehicleType
  keyword?: string
  maxDistance?: number
  sort?: 'distance' | 'price' | 'rating'
  includeFull?: boolean
  page?: number
  size?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
}
export type PageResponse<T> = { content: T[]; totalElements: number; totalPages: number; pageNumber: number; pageSize: number; currentPage?: number }

function resolveImageUrl(contentUrl: string) {
  try {
    return new URL(contentUrl, env.VITE_API_URL).toString()
  } catch {
    return contentUrl
  }
}

function mapImages(images?: ParkingLotImageDto[]) {
  return (images ?? []).map((image) => ({
    ...image,
    contentUrl: resolveImageUrl(image.contentUrl),
  }))
}

export const searchParkingLots = async (input: VehicleType | ParkingSearchInput, page = 0, size = 20) => {
  const params = typeof input === 'string'
    ? { vehicleType: input, page, size }
    : {
        vehicleType: input.vehicleType,
        includeFull: input.includeFull,
        page: input.page ?? page,
        size: input.size ?? size,
        latitude: input.latitude,
        longitude: input.longitude,
        radiusKm: input.radiusKm ?? input.maxDistance,
      }
  const vehicleType = typeof input === 'string' ? input : input.vehicleType
  const response = await apiClient.get<ApiResponse<PageResponse<ParkingLotSearchResponse>>>('/api/v1/parking-lots/search', { params })
  const data = response.data.data
  return {
    ...data,
    content: data.content.map((lot): ParkingLotDto => ({
      id: lot.id,
      merchantId: 0,
      merchantName: '',
      name: lot.name,
      address: lot.address,
      latitude: Number(lot.latitude),
      longitude: Number(lot.longitude),
      status: 'APPROVED',
      ratingAverage: Number(lot.averageRating ?? 0),
      distanceKm: lot.distanceKm != null ? Number(Number(lot.distanceKm).toFixed(2)) : undefined,
      slots: [{
        id: 0,
        vehicleType,
        totalCapacity: Number(lot.availableCapacity ?? 0),
        availableCapacity: Number(lot.availableCapacity ?? 0),
      }],
      pricingRules: lot.basePricePerHour == null ? [] : [{
        id: 0,
        vehicleType,
        basePricePerHour: Number(lot.basePricePerHour),
        surgeMultiplier: 1,
        overtimePenaltyMultiplier: 1,
      }],
    })),
  }
}

export const getParkingLotDetail = async (id: number) => {
  const response = await apiClient.get<ApiResponse<ParkingLotDto>>(`/api/v1/parking-lots/${id}`)
  const lot = response.data.data
  return {
    ...lot,
    latitude: Number(lot.latitude),
    longitude: Number(lot.longitude),
    ratingAverage: Number(lot.ratingAverage ?? 0),
    slots: lot.slots ?? [],
    pricingRules: lot.pricingRules ?? [],
    images: mapImages(lot.images),
  }
}

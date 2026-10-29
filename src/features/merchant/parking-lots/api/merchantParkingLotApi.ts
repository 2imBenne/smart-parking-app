import { apiClient } from '../../../../shared/api/apiClient'
import { env } from '../../../../app/env'
import type { ApiResponse } from '../../../../shared/api/types'
import type {
  ConfigurePricingRequest,
  ConfigureSlotRequest,
  BulkSlotConfigRequest,
  BulkPricingRuleRequest,
  CreateMerchantParkingLotRequest,
  MerchantParkingLot,
  MerchantParkingLotListParams,
  MerchantParkingLotPage,
  MerchantPricingRule,
  MerchantSlot,
  ParkingLotImage,
} from '../types/merchantParkingLotTypes'

export type MerchantRevenue = { totalRevenue: number; completedBookings: number }

function resolveImageUrl(contentUrl: string) {
  try {
    return new URL(contentUrl, env.VITE_API_URL).toString()
  } catch {
    return contentUrl
  }
}

function mapLotImages(images?: ParkingLotImage[]) {
  return (images ?? []).map((image) => ({
    ...image,
    contentUrl: resolveImageUrl(image.contentUrl),
  }))
}

export async function createMerchantParkingLot(request: CreateMerchantParkingLotRequest) {
  const response = await apiClient.post<ApiResponse<MerchantParkingLot>>('/api/v1/merchant/parking-lots', request)
  return response.data.data
}

export async function updateMerchantParkingLot(parkingLotId: number, request: CreateMerchantParkingLotRequest) {
  const response = await apiClient.put<ApiResponse<MerchantParkingLot>>(
    `/api/v1/merchant/parking-lots/${parkingLotId}`,
    request,
  )
  return response.data.data
}

export async function uploadMerchantParkingLotImages(parkingLotId: number, files: File[]) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  const response = await apiClient.post<ApiResponse<ParkingLotImage[]>>(
    `/api/v1/merchant/parking-lots/${parkingLotId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return mapLotImages(response.data.data)
}

export async function getMerchantParkingLots(params: MerchantParkingLotListParams) {
  const response = await apiClient.get<ApiResponse<MerchantParkingLotPage>>('/api/v1/merchant/parking-lots', { params })
  return response.data.data
}

export async function getMerchantParkingLotDetail(parkingLotId: number) {
  const response = await apiClient.get<ApiResponse<MerchantParkingLot>>(`/api/v1/merchant/parking-lots/${parkingLotId}`)
  const lot = response.data.data
  return {
    ...lot,
    images: mapLotImages(lot.images),
  }
}

export async function getMerchantParkingLotImages(parkingLotId: number) {
  const response = await apiClient.get<ApiResponse<ParkingLotImage[]>>(`/api/v1/parking-lots/${parkingLotId}/images`)
  return mapLotImages(response.data.data)
}

export async function getMerchantParkingLotSlots(parkingLotId: number) {
  const response = await apiClient.get<ApiResponse<MerchantSlot[]>>(`/api/v1/parking-lots/${parkingLotId}/slots`)
  return response.data.data
}

export async function configureMerchantParkingLotSlot(parkingLotId: number, request: ConfigureSlotRequest) {
  const response = await apiClient.put<ApiResponse<MerchantSlot>>(`/api/v1/merchant/parking-lots/${parkingLotId}/slots`, request)
  return response.data.data
}

export async function configureAllMerchantParkingLotSlots(parkingLotId: number, request: BulkSlotConfigRequest) {
  const response = await apiClient.put<ApiResponse<MerchantSlot[]>>(`/api/v1/merchant/parking-lots/${parkingLotId}/slots/bulk`, request)
  return response.data.data
}

export async function getMerchantParkingLotPricing(parkingLotId: number) {
  const response = await apiClient.get<ApiResponse<MerchantPricingRule[]>>(`/api/v1/parking-lots/${parkingLotId}/pricing`)
  return response.data.data
}

export async function configureMerchantParkingLotPricing(parkingLotId: number, request: ConfigurePricingRequest) {
  const response = await apiClient.put<ApiResponse<MerchantPricingRule>>(`/api/v1/merchant/parking-lots/${parkingLotId}/pricing`, request)
  return response.data.data
}

export async function configureAllMerchantParkingLotPricing(parkingLotId: number, request: BulkPricingRuleRequest) {
  const response = await apiClient.put<ApiResponse<MerchantPricingRule[]>>(`/api/v1/merchant/parking-lots/${parkingLotId}/pricing/bulk`, request)
  return response.data.data
}

export async function getMerchantParkingLotRevenue(parkingLotId: number) {
  try {
    const response = await apiClient.get<ApiResponse<MerchantRevenue>>(`/api/v1/merchant/parking-lots/${parkingLotId}/revenue`)
    return response.data.data
  } catch {
    return { totalRevenue: 0, completedBookings: 0 }
  }
}

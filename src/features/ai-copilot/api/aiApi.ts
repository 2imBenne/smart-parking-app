import { apiClient } from '../../../shared/api/apiClient'

export interface SuggestedParkingLot {
  lotId: number
  lotName: string
  address: string
  distanceKm?: number
  availableSlots?: number
  pricePerHour?: number
  averageRating?: number
  bookingUrl?: string
}

export interface AiChatRequest {
  message: string
  conversationId?: string
  userLat?: number
  userLon?: number
}

export interface AiChatResponse {
  reply: string
  source?: string
  suggestedLots?: SuggestedParkingLot[]
}

export interface ParkingDescriptionRequest {
  lotName: string
  address: string
  totalCapacity?: number
  supportedVehicleTypes?: string[]
  amenities?: string[]
  nearbyLandmarks?: string
}

export interface ParkingDescriptionResponse {
  marketingDescription: string
  operatingRegulations: string
  wayfindingGuide: string
}

export interface MockDataRequest {
  targetArea: string
  count?: number
  vehicleTypes?: string[]
}

export interface MockParkingLot {
  name: string
  address: string
  latitude: number
  longitude: number
  totalCapacity: number
  basePricePerHour: number
  slotDistribution: string[]
  sampleReviews: string[]
}

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
  const response = await apiClient.post<{ data: AiChatResponse }>('/api/v1/ai/chat', request)
  return response.data.data
}

export async function generateParkingDescription(
  request: ParkingDescriptionRequest
): Promise<ParkingDescriptionResponse> {
  const response = await apiClient.post<{ data: ParkingDescriptionResponse }>(
    '/api/v1/ai/generate-description',
    request
  )
  return response.data.data
}

export async function generateMockData(request: MockDataRequest): Promise<MockParkingLot[]> {
  const response = await apiClient.post<{ data: MockParkingLot[] }>(
    '/api/v1/ai/generate-mock-data',
    request
  )
  return response.data.data
}

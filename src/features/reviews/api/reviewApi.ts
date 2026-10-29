import { apiClient } from '../../../shared/api/apiClient'
import type { CreateReviewRequest } from '../types/reviewTypes'
import type { ApiResponse } from '../../../shared/api/types'

export type ReviewDto = {
  id: number
  bookingId: number
  parkingLotId: number
  userId: number
  rating: number
  comment: string
  createdAt: string
  userFullName?: string
}

export const createReview = async (request: CreateReviewRequest) => {
  const response = await apiClient.post<ApiResponse<ReviewDto>>('/api/v1/reviews', request)
  return response.data.data
}

export const getLotReviews = async (parkingLotId: number, page = 0, size = 10) => {
  const response = await apiClient.get<ApiResponse<{ content: ReviewDto[] }>>(`/api/v1/reviews/parking-lots/${parkingLotId}`, { params: { page, size } })
  return response.data.data
}

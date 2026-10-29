import { apiClient } from '../../../shared/api/apiClient'
import type { AddVehicleRequest, VehicleDto } from '../types/vehicleTypes'
import type { ApiResponse, PageResponse } from '../../../shared/api/types'

export const getMyVehicles = async (page = 0, size = 20) => {
  const response = await apiClient.get<ApiResponse<PageResponse<VehicleDto>>>('/api/v1/vehicles', { params: { page, size } })
  return response.data.data
}

export const addVehicle = async (request: AddVehicleRequest) => {
  const response = await apiClient.post<ApiResponse<VehicleDto>>('/api/v1/vehicles', request)
  return response.data.data
}

export const deleteVehicle = async (vehicleId: number) => {
  await apiClient.delete(`/api/v1/vehicles/${vehicleId}`)
}

export const updateVehicle = async (vehicleId: number, request: AddVehicleRequest) => {
  const response = await apiClient.put<ApiResponse<VehicleDto>>(`/api/v1/vehicles/${vehicleId}`, request)
  return response.data.data
}

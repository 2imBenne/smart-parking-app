export type VehicleType = 'SEDAN_SUV' | 'BUS_COACH' | 'LIGHT_TRUCK' | 'HEAVY_TRUCK' | 'CONTAINER'
export type VehicleStatus = 'ACTIVE' | 'INACTIVE'

export type VehicleDto = {
  id: number
  licensePlate: string
  vehicleType: VehicleType
  weightTon: number
  brandModel?: string | null
  status: VehicleStatus
}

export type AddVehicleRequest = {
  licensePlate: string
  vehicleType: VehicleType
  weightTon: number
  brandModel?: string | null
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN_SUV: 'Ô tô con / SUV',
  BUS_COACH: 'Xe khách / Xe buýt',
  LIGHT_TRUCK: 'Xe tải nhẹ',
  HEAVY_TRUCK: 'Xe tải nặng',
  CONTAINER: 'Xe container',
}

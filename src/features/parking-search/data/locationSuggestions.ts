export type LocationSuggestion = {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'CITY' | 'DISTRICT' | 'LANDMARK' | 'PORT' | 'PARKING'
  distanceKm?: number
}

export const locationSuggestions: LocationSuggestion[] = [
  { id: 'cat-lai', name: 'Cảng Cát Lái', address: 'Nguyễn Thị Định, Cát Lái, TP. Thủ Đức, TP.HCM', latitude: 10.7697, longitude: 106.7877, type: 'PORT' },
  { id: 'thu-duc', name: 'TP. Thủ Đức', address: 'Thành phố Hồ Chí Minh', latitude: 10.8494, longitude: 106.7537, type: 'CITY' },
  { id: 'mien-dong', name: 'Bến xe Miền Đông mới', address: 'Hoàng Hữu Nam, Long Bình, TP. Thủ Đức', latitude: 10.8792, longitude: 106.8144, type: 'LANDMARK' },
  { id: 'tan-cang', name: 'Tân Cảng Cát Lái', address: 'Cát Lái, TP. Thủ Đức, TP.HCM', latitude: 10.7566, longitude: 106.7918, type: 'PORT' },
  { id: 'quan-7', name: 'Quận 7', address: 'Thành phố Hồ Chí Minh', latitude: 10.734, longitude: 106.7216, type: 'DISTRICT' },
  { id: 'binh-thanh', name: 'Quận Bình Thạnh', address: 'Thành phố Hồ Chí Minh', latitude: 10.8106, longitude: 106.7091, type: 'DISTRICT' },
  { id: 'di-an', name: 'Thành phố Dĩ An', address: 'Bình Dương', latitude: 10.9068, longitude: 106.7694, type: 'CITY' },
  { id: 'bien-hoa', name: 'Thành phố Biên Hòa', address: 'Đồng Nai', latitude: 10.9574, longitude: 106.8426, type: 'CITY' },
  { id: 'long-thanh', name: 'Long Thành', address: 'Đồng Nai', latitude: 10.7923, longitude: 106.9519, type: 'DISTRICT' },
  { id: 'ben-tre', name: 'Thành phố Bến Tre', address: 'Tỉnh Bến Tre', latitude: 10.2434, longitude: 106.3756, type: 'CITY' },
]

import { useEffect, useMemo, useRef, useState } from 'react'
import { message } from 'antd'
import { getDrivingRoute, searchPlaces, type RouteResult } from '../api/mapProvider'
import { searchParkingLots } from '../api/parkingApi'
import type { DriverPosition } from '../components/DriverParkingMap'
import type { LocationSuggestion } from '../data/locationSuggestions'
import type { ParkingLotDto } from '../types/parkingTypes'
import { getMyVehicles } from '../../vehicles/api/vehicleApi'
import type { VehicleDto, VehicleType } from '../../vehicles/types/vehicleTypes'

const POSITION_KEY = 'smart-truck-parking.driver-position'
type LocationState = 'idle' | 'loading' | 'success' | 'error'

export function useSearchParking() {
  const searchBoxRef = useRef<HTMLLabelElement>(null)
  const routeRequestRef = useRef(0)
  const [vehicles, setVehicles] = useState<VehicleDto[]>([])
  const [vehicleId, setVehicleId] = useState<number>()
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType>('SEDAN_SUV')
  const [keyword, setKeyword] = useState('')
  const [distance, setDistance] = useState(20)
  const [sort, setSort] = useState<'distance' | 'price' | 'rating'>('distance')
  const [includeFull, setIncludeFull] = useState(true)
  const [sourceLots, setSourceLots] = useState<ParkingLotDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [userPosition, setUserPosition] = useState<DriverPosition | null>(() => readPosition())
  const [customPosition, setCustomPosition] = useState<DriverPosition | null>(null)
  const [pendingMapPosition, setPendingMapPosition] = useState<DriverPosition | null>(null)
  const [destination, setDestination] = useState<LocationSuggestion | null>(null)
  const [locationState, setLocationState] = useState<LocationState>(() => readPosition() ? 'success' : 'idle')
  const [locationError, setLocationError] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [route, setRoute] = useState<RouteResult | null>(null)

  const vehicle = vehicles.find(item => item.id === vehicleId)
  const activeVehicleType: VehicleType = vehicle?.vehicleType ?? vehicleTypeFilter
  const searchPosition: DriverPosition | null = customPosition ?? destination ?? userPosition
  const lots = useMemo(() => {
    const values = sourceLots.map(lot => {
      if (lot.distanceKm != null) {
        return { ...lot, etaMinutes: Math.max(2, Math.round(lot.distanceKm / 28 * 60)) }
      }
      return searchPosition ? withDistance(lot, searchPosition) : lot
    })
    return [...values].sort((a, b) =>
      sort === 'price'
        ? (a.pricingRules[0]?.basePricePerHour ?? 0) - (b.pricingRules[0]?.basePricePerHour ?? 0)
        : sort === 'rating'
          ? b.ratingAverage - a.ratingAverage
          : (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  }, [searchPosition, sort, sourceLots])
  const selectedLot = lots.find(lot => lot.id === selectedId) ?? null

  const load = async (selected?: VehicleDto, positionOverride?: DriverPosition | null, typeOverride?: VehicleType) => {
    const targetType = selected?.vehicleType ?? (selected === undefined && vehicle ? vehicle.vehicleType : (typeOverride ?? vehicleTypeFilter))
    const position = positionOverride === undefined ? searchPosition : positionOverride
    setLoading(true)
    try {
      const result = await searchParkingLots({
        vehicleType: targetType,
        maxDistance: distance,
        radiusKm: distance,
        sort,
        includeFull,
        latitude: position?.latitude,
        longitude: position?.longitude,
        size: 50,
      })
      setSourceLots(result.content)
      setSelectedId(current => result.content.some(lot => lot.id === current) ? current : result.content[0]?.id ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getMyVehicles(0, 50)
      .then(result => {
        if (!mounted) return
        setVehicles(result.content)
        const first = result.content[0]
        if (first) {
          setVehicleId(first.id)
          setVehicleTypeFilter(first.vehicleType)
        }
      })
      .catch(error => {
        console.error('Failed to load vehicles:', error)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const targetType = vehicle?.vehicleType ?? vehicleTypeFilter

    const fetchLots = async () => {
      try {
        const result = await searchParkingLots({
          vehicleType: targetType,
          maxDistance: distance,
          radiusKm: distance,
          sort,
          includeFull,
          latitude: searchPosition?.latitude,
          longitude: searchPosition?.longitude,
          size: 50,
        })
        if (active) {
          setSourceLots(result.content)
          setSelectedId(current =>
            result.content.some(lot => lot.id === current) ? current : result.content[0]?.id ?? null
          )
        }
      } catch (error) {
        console.error('Failed to search parking lots:', error)
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchLots()
    return () => {
      active = false
    }
  }, [vehicle?.vehicleType, vehicleTypeFilter, distance, sort, includeFull, searchPosition?.latitude, searchPosition?.longitude])
  useEffect(() => {
    if (!suggestionsOpen || keyword.trim().length < 2 || destination) return
    let active = true
    const timer = window.setTimeout(() => {
      setSuggestionsLoading(true)
      void searchPlaces(keyword, userPosition).then(result => {
        if (active) setSuggestions(result)
      }).finally(() => {
        if (active) setSuggestionsLoading(false)
      })
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [destination, keyword, suggestionsOpen, userPosition])

  useEffect(() => {
    if (!searchPosition || !selectedLot) return
    let active = true
    const requestId = ++routeRequestRef.current
    void getDrivingRoute(searchPosition, selectedLot).then(result => { if (active && requestId === routeRequestRef.current) setRoute(result) })
    return () => { active = false }
  }, [searchPosition, selectedLot])

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) setSuggestionsOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const chooseSuggestion = (item: LocationSuggestion) => {
    routeRequestRef.current += 1
    setRoute(null)
    setKeyword(item.name)
    setDestination(item)
    setCustomPosition(null)
    setPendingMapPosition(null)
    setSuggestionsOpen(false)
    setActiveSuggestion(0)
    message.success(`Đang tìm bãi gần ${item.name}`)
  }

  const inputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || !suggestions.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveSuggestion(value => (value + 1) % suggestions.length) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveSuggestion(value => (value - 1 + suggestions.length) % suggestions.length) }
    else if (event.key === 'Enter') { event.preventDefault(); chooseSuggestion(suggestions[activeSuggestion]) }
    else if (event.key === 'Escape') setSuggestionsOpen(false)
  }

  const locateMe = () => {
    if (!navigator.geolocation) { setLocationError('Trình duyệt không hỗ trợ định vị.'); return }
    setLocationState('loading')
    routeRequestRef.current += 1
    setRoute(null)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const next = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }
      setUserPosition(next)
      setCustomPosition(null)
      setPendingMapPosition(null)
      setDestination(null)
      setKeyword('Vị trí hiện tại của tôi')
      sessionStorage.setItem(POSITION_KEY, JSON.stringify(next))
      setLocationState('success')
      setSuggestionsOpen(false)
      message.success('Đã cập nhật khoảng cách từ vị trí của bạn')
    }, error => {
      setLocationState('error')
      setLocationError(error.code === error.PERMISSION_DENIED ? 'Bạn đã từ chối quyền vị trí. Hãy cấp lại quyền hoặc chọn một địa điểm gợi ý.' : 'Không thể xác định vị trí. Hãy kiểm tra GPS hoặc chọn một địa điểm gợi ý.')
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 })
  }

  const onKeywordChange = (value: string) => {
    setKeyword(value)
    setDestination(null)
    setSuggestionsOpen(true)
    setActiveSuggestion(0)
  }
  const confirmMapPosition = () => {
    if (!pendingMapPosition) return
    routeRequestRef.current += 1
    setCustomPosition(pendingMapPosition)
    setRoute(null)
    setPendingMapPosition(null)
    setDestination(null)
    setKeyword('Điểm xuất phát đã chọn trên bản đồ')
    message.success('Đã cập nhật điểm xuất phát')
  }
  const pickMapPosition = (position: DriverPosition | null) => {
    routeRequestRef.current += 1
    setRoute(null)
    setPendingMapPosition(position)
  }
  const selectParkingLot = (id: number) => {
    routeRequestRef.current += 1
    setRoute(null)
    setSelectedId(id)
  }

  return {
    vehicles, vehicleId, setVehicleId, vehicle, vehicleTypeFilter, setVehicleTypeFilter, activeVehicleType, keyword, distance, setDistance, sort, setSort, includeFull, setIncludeFull,
    lots, loading, selectedId, searchPosition, pendingMapPosition, destination, setDestination, locationState, locationError,
    suggestions, suggestionsOpen, setSuggestionsOpen, suggestionsLoading, activeSuggestion, route, selectedLot,
    searchBoxRef, chooseSuggestion, inputKeyDown, locateMe, onKeywordChange, confirmMapPosition, pickMapPosition, selectParkingLot, load, customPosition, userPosition
  }
}

function readPosition(): DriverPosition | null { try { const raw = sessionStorage.getItem(POSITION_KEY); return raw ? JSON.parse(raw) as DriverPosition : null } catch { return null } }
function withDistance(lot: ParkingLotDto, position: DriverPosition): ParkingLotDto { const straight = haversine(position.latitude, position.longitude, lot.latitude, lot.longitude); const road = Math.max(.1, straight * 1.22); return { ...lot, distanceKm: Number(road.toFixed(2)), etaMinutes: Math.max(2, Math.round(road / 28 * 60)) } }
function haversine(a: number, b: number, c: number, d: number) { const r = 6371; const rad = (value: number) => value * Math.PI / 180; const x = rad(c - a); const y = rad(d - b); const n = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2; return r * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n)) }

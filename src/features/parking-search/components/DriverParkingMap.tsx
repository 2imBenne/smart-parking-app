import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ParkingLotDto } from '../types/parkingTypes'

export type DriverPosition = { latitude: number; longitude: number; accuracy?: number }
type Props = {
  lots: ParkingLotDto[]
  selectedId: number | null
  userPosition: DriverPosition | null
  pickedPosition?: DriverPosition | null
  routeCoordinates?: [number, number][]
  onSelect: (id: number) => void
  onPositionPick?: (position: DriverPosition) => void
  onConfirmPicked?: () => void
  onCancelPicked?: () => void
}

export function DriverParkingMap({ lots, selectedId, userPosition, pickedPosition, routeCoordinates, onSelect, onPositionPick, onConfirmPicked, onCancelPicked }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  const onPositionPickRef = useRef(onPositionPick)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onPositionPickRef.current = onPositionPick }, [onPositionPick])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: [10.81, 106.78], zoom: 12, zoomControl: true, attributionControl: true, doubleClickZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
    layersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    const pick = (latlng: L.LatLng) => onPositionPickRef.current?.({ latitude: latlng.lat, longitude: latlng.lng })
    map.on('dblclick', event => pick(event.latlng))

    let holdTimer: number | undefined
    let holdPoint: L.LatLng | undefined
    const cancelHold = () => { if (holdTimer) window.clearTimeout(holdTimer); holdTimer = undefined }
    map.on('touchstart', event => {
      holdPoint = (event as L.LeafletMouseEvent).latlng
      cancelHold()
      holdTimer = window.setTimeout(() => { if (holdPoint) pick(holdPoint); cancelHold() }, 650)
    })
    map.on('touchmove touchend', cancelHold)
    const timer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => { window.clearTimeout(timer); cancelHold(); map.remove(); mapRef.current = null; layersRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layersRef.current
    if (!map || !group) return
    group.clearLayers()
    const bounds: L.LatLngExpression[] = []
    lots.forEach(lot => {
      const availableCapacity = lot.slots.reduce((sum, slot) => sum + slot.availableCapacity, 0)
      const totalCapacity = lot.slots.reduce((sum, slot) => sum + slot.totalCapacity, 0)
      const basePrice = lot.pricingRules[0]?.basePricePerHour ?? 0
      const position: L.LatLngExpression = [lot.latitude, lot.longitude]
      bounds.push(position)
      const capacityLabel = totalCapacity
        ? availableCapacity
          ? `${availableCapacity}/${totalCapacity}`
          : `0/${totalCapacity}`
        : '—'
      const icon = L.divIcon({ className: 'driver-map-marker-wrapper', html: `<span class="driver-map-marker ${lot.id === selectedId ? 'selected' : ''} ${availableCapacity ? '' : 'full'}"><b>${formatMoney(basePrice)}</b><small>${capacityLabel}</small></span>`, iconSize: [88, 54], iconAnchor: [44, 54] })
      const marker = L.marker(position, { icon, title: lot.name }).addTo(group)
      const distLabel = lot.distanceKm != null ? `${Number(lot.distanceKm).toFixed(2)} km` : ''
      marker.bindTooltip(`<strong>${escapeHtml(lot.name)}</strong><br>${distLabel ? `${distLabel} · ` : ''}${lot.etaMinutes} phút`, { direction: 'top', offset: [0, -46] })
      marker.on('click', () => onSelectRef.current(lot.id))
    })
    if (userPosition) {
      const point: L.LatLngExpression = [userPosition.latitude, userPosition.longitude]
      bounds.push(point)
      const userIcon = L.divIcon({ className: 'driver-user-marker-wrapper', html: '<span class="driver-user-marker"><i></i></span>', iconSize: [34, 34], iconAnchor: [17, 17] })
      L.marker(point, { icon: userIcon, title: 'Điểm xuất phát', zIndexOffset: 1000 }).bindTooltip(userPosition.accuracy ? 'Vị trí GPS hiện tại' : 'Điểm xuất phát đã chọn', { permanent: false }).addTo(group)
      if (userPosition.accuracy) L.circle(point, { radius: userPosition.accuracy, color: '#1677ff', fillColor: '#91caff', fillOpacity: .12, weight: 1 }).addTo(group)
    }
    if (pickedPosition) {
      const point: L.LatLngExpression = [pickedPosition.latitude, pickedPosition.longitude]
      bounds.push(point)
      const pickedIcon = L.divIcon({ className: 'driver-picked-marker-wrapper', html: '<span class="driver-picked-marker"><i></i></span>', iconSize: [38, 46], iconAnchor: [19, 44] })
      L.marker(point, { icon: pickedIcon, title: 'Điểm xuất phát tạm' }).bindTooltip('Điểm xuất phát tạm — hãy xác nhận', { permanent: true, direction: 'top' }).addTo(group)
    }
    if (routeCoordinates?.length) L.polyline(routeCoordinates, { color: '#e08a00', weight: 6, opacity: .9, lineCap: 'round', lineJoin: 'round' }).addTo(group)
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [65, 65], maxZoom: 14 })
  }, [lots, pickedPosition, routeCoordinates, selectedId, userPosition])

  return <div className="driver-live-map"><div ref={containerRef} className="driver-live-map-canvas" aria-label="Bản đồ tìm bãi và chọn điểm xuất phát" /><div className="map-pick-hint">Double-click hoặc nhấn giữ để chọn điểm xuất phát</div>{pickedPosition && <div className="map-confirm-overlay"><strong>Dùng điểm này làm điểm xuất phát?</strong><span>{pickedPosition.latitude.toFixed(5)}, {pickedPosition.longitude.toFixed(5)}</span><div><button type="button" onClick={onCancelPicked}>Hủy</button><button type="button" className="primary" onClick={onConfirmPicked}>Dùng điểm này</button></div></div>}<div className="driver-map-legend">{userPosition && <span><i className={userPosition.accuracy ? 'user' : 'picked'} /> {userPosition.accuracy ? 'Vị trí GPS' : 'Điểm đã chọn'}</span>}<span><i /> Còn chỗ</span><span><i className="full" /> Đã đầy</span></div></div>
}

function formatMoney(value: number) { return `${new Intl.NumberFormat('vi-VN').format(value)}đ` }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char) }

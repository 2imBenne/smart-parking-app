import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type ParkingLotMapPickerProps = {
  latitude?: number
  longitude?: number
  accuracy?: number
  onChange: (latitude: number, longitude: number) => void
}

const defaultCenter: L.LatLngExpression = [10.7769, 106.7009]

const markerIcon = L.divIcon({
  className: 'merchant-map-marker-wrapper',
  html: '<span class="merchant-map-marker" aria-hidden="true"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

export function ParkingLotMapPicker({ latitude, longitude, accuracy, onChange }: ParkingLotMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)
  const onChangeRef = useRef(onChange)
  const initialCoordinatesRef = useRef(getCoordinates(latitude, longitude))

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const initialCoordinates = initialCoordinatesRef.current
    const initialCenter: L.LatLngExpression = initialCoordinates ?? defaultCenter
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialCoordinates ? 16 : 12,
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    map.on('click', ({ latlng }: L.LeafletMouseEvent) => {
      onChangeRef.current(roundCoordinate(latlng.lat), roundCoordinate(latlng.lng))
    })
    mapRef.current = map
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0)
    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
      accuracyCircleRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const coordinates = getCoordinates(latitude, longitude)
    if (!map || !coordinates) return
    const position: L.LatLngExpression = coordinates
    if (!markerRef.current) {
      const marker = L.marker(position, { draggable: true, icon: markerIcon, title: 'Vị trí bãi đỗ' }).addTo(map)
      marker.on('dragend', () => {
        const next = marker.getLatLng()
        onChangeRef.current(roundCoordinate(next.lat), roundCoordinate(next.lng))
      })
      markerRef.current = marker
    } else {
      markerRef.current.setLatLng(position)
    }
    map.panTo(position, { animate: true, duration: 0.25 })

    if (accuracy && accuracy > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle(position, {
          radius: accuracy,
          color: '#1677ff',
          fillColor: '#91caff',
          fillOpacity: 0.2,
          weight: 1,
        }).addTo(map)
      } else {
        accuracyCircleRef.current.setLatLng(position).setRadius(accuracy)
      }
    } else if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove()
      accuracyCircleRef.current = null
    }
  }, [accuracy, latitude, longitude])

  return <div className="merchant-map-picker">
    <div ref={containerRef} className="merchant-map-canvas" aria-label="Bản đồ chọn vị trí bãi đỗ" />
    <p>Nhấn lên bản đồ hoặc kéo ghim để chọn đúng vị trí. Có thể phóng to để đặt ghim chính xác hơn.</p>
    {accuracy && accuracy > 0 && <small>Độ chính xác GPS do thiết bị cung cấp: khoảng ±{Math.round(accuracy)} m.</small>}
  </div>
}

function getCoordinates(latitude?: number, longitude?: number): [number, number] | null {
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null
  return [latitude, longitude]
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(7))
}

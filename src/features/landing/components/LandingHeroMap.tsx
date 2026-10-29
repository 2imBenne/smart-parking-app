import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const yards = [
  { name: 'An Phát – Cát Lái', lat: 10.7706, lng: 106.7882, spaces: 5, price: '35K' },
  { name: 'Tân Cảng', lat: 10.7632, lng: 106.7708, spaces: 3, price: '33K' },
  { name: 'Miền Đông mới', lat: 10.8781, lng: 106.8142, spaces: 12, price: '32K' },
]

export function LandingHeroMap({ onOpenSearch }: { onOpenSearch: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: [10.79, 106.785], zoom: 12, zoomControl: false, attributionControl: false, scrollWheelZoom: false, doubleClickZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)
    const driverIcon = L.divIcon({ className: 'landing-driver-icon-wrap', html: '<span class="landing-driver-icon"><i></i></span>', iconSize: [28, 28], iconAnchor: [14, 14] })
    L.marker([10.781, 106.779], { icon: driverIcon, title: 'Vị trí tài xế' }).bindTooltip('Vị trí tài xế', { direction: 'top' }).addTo(map)
    yards.forEach((yard, index) => {
      const icon = L.divIcon({ className: 'landing-yard-marker-wrap', html: `<span class="landing-yard-marker ${index === 0 ? 'active' : ''}"><b>${yard.price}</b><small>${yard.spaces} chỗ</small></span>`, iconSize: [58, 43], iconAnchor: [29, 43] })
      L.marker([yard.lat, yard.lng], { icon, title: yard.name }).bindTooltip(`<strong>${yard.name}</strong><br>${yard.spaces} chỗ trống`, { direction: 'top', offset: [0, -34] }).on('click', onOpenSearch).addTo(map)
    })
    L.polyline([[10.781, 106.779], [10.776, 106.784], [10.7706, 106.7882]], { color: '#e08a00', weight: 5, opacity: .9, dashArray: '8 7' }).addTo(map)
    mapRef.current = map
    const timer = window.setTimeout(() => map.invalidateSize(), 100)
    return () => { window.clearTimeout(timer); map.remove(); mapRef.current = null }
  }, [onOpenSearch])
  return <div className="landing-live-map"><div ref={containerRef} className="landing-live-map-canvas" /><div className="landing-map-label"><strong>3 bãi gần bạn</strong><span>Cập nhật chỗ trống trực tiếp</span></div><button type="button" onClick={onOpenSearch}>Mở bản đồ tìm bãi</button></div>
}

import { ExternalLink } from 'lucide-react'
import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  latitude: number
  longitude: number
  name: string
  address: string
}

const markerIcon = L.divIcon({
  className: 'admin-lot-marker-wrapper',
  html: '<span class="admin-lot-marker"><i></i></span>',
  iconSize: [42, 50],
  iconAnchor: [21, 48],
})

export function AdminParkingLotMap({ latitude, longitude, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const position: L.LatLngExpression = [latitude, longitude]
    const map = L.map(containerRef.current, {
      center: position,
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    L.marker(position, { icon: markerIcon, title: name })
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(name)}</strong><br><span>${escapeHtml(address)}</span>`)
      .openPopup()

    mapRef.current = map
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
    }
  }, [address, latitude, longitude, name])

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return <div className="admin-lot-map">
    <div ref={containerRef} className="admin-lot-map-canvas" aria-label={`Bản đồ vị trí ${name}`} />
    <div className="admin-lot-map-info">
      <span><strong>{latitude.toFixed(6)}, {longitude.toFixed(6)}</strong><small>{address}</small></span>
      <a href={mapsUrl} target="_blank" rel="noreferrer">Mở Google Maps <ExternalLink aria-hidden="true" /></a>
    </div>
  </div>
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}

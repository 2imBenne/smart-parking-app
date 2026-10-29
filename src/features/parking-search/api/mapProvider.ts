import type { DriverPosition } from '../components/DriverParkingMap'
import { locationSuggestions, type LocationSuggestion } from '../data/locationSuggestions'

export type RouteResult = { coordinates: [number, number][]; distanceKm: number; durationMinutes: number; provider: 'MAPBOX' | 'OSRM' | 'ESTIMATE' }
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

export async function searchPlaces(query: string, origin?: DriverPosition | null): Promise<LocationSuggestion[]> {
  const value = query.trim()
  if (value.length < 2) return []
  if (mapboxToken) {
    try {
      const proximity = origin ? `&proximity=${origin.longitude},${origin.latitude}` : ''
      const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(value)}&country=vn&language=vi&limit=7${proximity}&access_token=${encodeURIComponent(mapboxToken)}`)
      if (!response.ok) throw new Error('Mapbox Geocoding unavailable')
      const payload = await response.json() as { features?: Array<{ id: string; geometry: { coordinates: [number, number] }; properties?: { name?: string; full_address?: string; place_formatted?: string } }> }
      return (payload.features ?? []).map(feature => {
        const [longitude, latitude] = feature.geometry.coordinates
        return {
          id: feature.id,
          name: feature.properties?.name ?? value,
          address: feature.properties?.full_address ?? feature.properties?.place_formatted ?? 'Việt Nam',
          latitude,
          longitude,
          type: 'LANDMARK' as const,
          distanceKm: origin ? Number(haversine(origin.latitude, origin.longitude, latitude, longitude).toFixed(2)) : undefined,
        }
      })
    } catch {
      // The local catalogue keeps the mock-first Driver UI usable when the provider is unavailable.
    }
  }
  const normalized = normalize(value)
  return locationSuggestions
    .filter(item => normalize(`${item.name} ${item.address}`).includes(normalized))
    .slice(0, 7)
    .map(item => ({ ...item, distanceKm: origin ? Number(haversine(origin.latitude, origin.longitude, item.latitude, item.longitude).toFixed(2)) : undefined }))
}

export async function getDrivingRoute(origin: DriverPosition, destination: DriverPosition): Promise<RouteResult> {
  try {
    if (mapboxToken) {
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
      const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxToken)}`)
      if (!response.ok) throw new Error('Mapbox Directions unavailable')
      const payload = await response.json() as { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> }
      const route = payload.routes?.[0]; if (!route) throw new Error('No Mapbox route')
      return { coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), distanceKm: Number((route.distance / 1000).toFixed(2)), durationMinutes: Math.max(1, Math.round(route.duration / 60)), provider: 'MAPBOX' }
    }
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`)
    if (!response.ok) throw new Error('OSRM unavailable')
    const payload = await response.json() as { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }> }
    const route = payload.routes?.[0]; if (!route) throw new Error('No OSRM route')
    return { coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), distanceKm: Number((route.distance / 1000).toFixed(2)), durationMinutes: Math.max(1, Math.round(route.duration / 60)), provider: 'OSRM' }
  } catch {
    const distanceKm = haversine(origin.latitude, origin.longitude, destination.latitude, destination.longitude) * 1.22
    return { coordinates: [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]], distanceKm: Number(distanceKm.toFixed(2)), durationMinutes: Math.max(2, Math.round(distanceKm / 28 * 60)), provider: 'ESTIMATE' }
  }
}

function haversine(a: number, b: number, c: number, d: number) { const r = 6371; const rad = (v: number) => v * Math.PI / 180; const x = rad(c - a); const y = rad(d - b); const n = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2; return r * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n)) }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() }

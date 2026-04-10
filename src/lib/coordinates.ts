import type { LatLng, Participant } from '../types'

const EARTH_RADIUS_M = 6_371_000

/** Returns the great-circle distance in metres between two coordinates. */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Returns true when two locations are within thresholdM metres of each other. */
export function areNeighbors(a: LatLng, b: LatLng, thresholdM = 150): boolean {
  return haversineDistance(a, b) <= thresholdM
}

/** Builds an OpenStreetMap permalink for a location. */
export function generateOsmLink(coords: LatLng, zoom = 17): string {
  return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=${zoom}`
}

/**
 * Converts WGS84 (lat/lng) to Dutch RD New (EPSG:28992) X/Y coordinates.
 * Uses the official RDNAPTRANS polynomial approximation (accurate to ~1m in NL).
 * Required for the PDOK reverse geocode API, which expects RD coordinates.
 */
export function wgs84ToRd(coords: LatLng): { X: number; Y: number } {
  const dPhi = 0.36 * (coords.lat - 52.15517440)
  const dLam = 0.36 * (coords.lng - 5.38720621)

  const X =
    155000.0 +
    190094.945 * dLam +
    -11832.228 * dPhi * dLam +
    -114.221 * dLam ** 3 +
    -32.391 * dPhi ** 2 * dLam +
    -0.705 * dLam ** 2 +
    -2.340 * dPhi ** 3 * dLam +
    0.608 * dPhi * dLam ** 3

  const Y =
    463000.0 +
    309056.544 * dPhi +
    3638.893 * dLam ** 2 +
    73.077 * dPhi ** 2 +
    -157.984 * dPhi * dLam ** 2 +
    -5.765 * dPhi ** 3 +
    11.350 * dPhi * dLam ** 2 +
    -1.371 * dPhi ** 2 * dLam ** 2

  return { X, Y }
}

/**
 * Returns a random point that lies between minM and maxM metres from center,
 * using a simple equirectangular projection (accurate enough for city-scale distances).
 */
export function randomPointInRing(center: LatLng, minM: number, maxM: number): LatLng {
  const bearing = Math.random() * 2 * Math.PI
  const distance = minM + Math.random() * (maxM - minM)
  const metersPerDegreeLat = (Math.PI * EARTH_RADIUS_M) / 180
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((center.lat * Math.PI) / 180)
  const lat = center.lat + (distance * Math.cos(bearing)) / metersPerDegreeLat
  const lng = center.lng + (distance * Math.sin(bearing)) / metersPerDegreeLng
  return { lat, lng }
}

/**
 * Builds an adjacency map of participants that live within thresholdM metres
 * of each other. Only participants with known coordinates are included.
 */
export function buildNeighborGraph(
  participants: Participant[],
  thresholdM = 150,
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  const withCoords = participants.filter((p) => p.coordinates !== null)

  for (const p of withCoords) {
    if (!graph.has(p.id)) graph.set(p.id, new Set())
  }

  for (let i = 0; i < withCoords.length; i++) {
    for (let j = i + 1; j < withCoords.length; j++) {
      const a = withCoords[i]
      const b = withCoords[j]
      if (areNeighbors(a.coordinates!, b.coordinates!, thresholdM)) {
        graph.get(a.id)!.add(b.id)
        graph.get(b.id)!.add(a.id)
      }
    }
  }

  return graph
}

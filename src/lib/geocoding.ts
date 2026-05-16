import type { LatLng } from '../types'
import { wgs84ToRd } from './coordinates'

interface PdokResponse {
  response: {
    docs: Array<{
      weergavenaam?: string
      centroide_ll?: string
    }>
    numFound: number
  }
}

/** Parses "POINT(lon lat)" into a LatLng object. */
function parseCentroide(centroide: string): LatLng {
  const match = /POINT\(([^\s]+)\s+([^)]+)\)/.exec(centroide)
  if (!match) throw new Error(`Cannot parse centroide_ll: ${centroide}`)
  const lng = parseFloat(match[1])
  const lat = parseFloat(match[2])
  return { lat, lng }
}

/**
 * Reverse-geocodes a WGS84 coordinate using the PDOK Locatieserver API.
 * PDOK reverse geocoding requires RD New (EPSG:28992) coordinates, so
 * we convert from WGS84 first.
 * Returns the nearest Dutch address string, or null if nothing found nearby.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  const { X, Y } = wgs84ToRd(coords)
  const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse')
  url.searchParams.set('X', X.toFixed(0))
  url.searchParams.set('Y', Y.toFixed(0))
  url.searchParams.set('rows', '1')
  url.searchParams.set('fq', 'type:adres')
  url.searchParams.set('fl', 'weergavenaam')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) return null
    const data = (await response.json()) as PdokResponse
    const doc = data.response?.docs?.[0]
    return doc?.weergavenaam ?? null
  } catch {
    return null
  }
}
export async function geocodeAddress(
  address: string,
): Promise<{ address: string; coordinates: LatLng }> {
  const url = new URL('https://api.pdok.nl/bzk/locatieserver/search/v3_1/free')
  url.searchParams.set('q', address)
  url.searchParams.set('rows', '1')
  url.searchParams.set('fl', 'weergavenaam,centroide_ll')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`PDOK API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as PdokResponse
  const docs = data.response?.docs

  if (!docs || docs.length === 0) {
    throw new Error(`Address not found: ${address}`)
  }

  const doc = docs[0]
  if (!doc.centroide_ll) {
    throw new Error(`No coordinates returned for: ${address}`)
  }

  const coordinates = parseCentroide(doc.centroide_ll)
  const canonicalAddress = doc.weergavenaam ?? address

  // PDOK sometimes returns a street-level match without the house number.
  // If the original address contains a number but the canonical one doesn't,
  // keep the original to avoid losing precision.
  const originalHasNumber = /\d/.test(address)
  const canonicalHasNumber = /\d/.test(canonicalAddress)
  const finalAddress = originalHasNumber && !canonicalHasNumber ? address : canonicalAddress

  return { address: finalAddress, coordinates }
}

import type { LatLng, Participant, Schedule } from '../types'

export interface Journey {
  participantId: string
  starter: LatLng | null
  main: LatLng | null
  dessert: LatLng | null
}

export interface RouteSegment {
  from: LatLng
  to: LatLng
  type: 'to-main' | 'to-dessert'
}

/** Build each participant's venue coordinates per course. */
export function buildJourneys(schedule: Schedule, participants: Participant[]): Journey[] {
  const pMap = new Map(participants.map((p) => [p.id, p]))

  // For each course, map participantId → the coordinates of the table they attend
  const venueByParticipant = new Map<string, Map<string, LatLng | null>>()
  for (const p of participants) {
    venueByParticipant.set(p.id, new Map())
  }

  for (const table of schedule.tables) {
    const host = pMap.get(table.hostId)
    const hostCoords = host?.coordinates ?? null

    // Host stays at their own address
    venueByParticipant.get(table.hostId)?.set(table.course, host?.coordinates ?? null)

    // Guests visit the host's address
    for (const guestId of table.guestIds) {
      venueByParticipant.get(guestId)?.set(table.course, hostCoords)
    }
  }

  return participants.map((p) => {
    const venues = venueByParticipant.get(p.id)
    return {
      participantId: p.id,
      starter: venues?.get('starter') ?? null,
      main: venues?.get('main') ?? null,
      dessert: venues?.get('dessert') ?? null,
    }
  })
}

/**
 * Return deduplicated route segments for the given filter.
 * Same from→to pair used by multiple participants is returned only once.
 */
export function buildUniqueSegments(
  journeys: Journey[],
  filter: 'both' | 'to-main' | 'to-dessert',
): RouteSegment[] {
  const seen = new Set<string>()
  const segments: RouteSegment[] = []

  function add(from: LatLng | null, to: LatLng | null, type: RouteSegment['type']) {
    if (!from || !to) return
    // Skip if origin and destination are the same (host staying home)
    if (from.lat === to.lat && from.lng === to.lng) return
    const key = `${from.lat.toFixed(5)},${from.lng.toFixed(5)}-${to.lat.toFixed(5)},${to.lng.toFixed(5)}`
    if (seen.has(key)) return
    seen.add(key)
    segments.push({ from, to, type })
  }

  for (const j of journeys) {
    if (filter !== 'to-dessert') add(j.starter, j.main, 'to-main')
    if (filter !== 'to-main') add(j.main, j.dessert, 'to-dessert')
  }

  return segments
}

/** Decode a Valhalla/Google encoded polyline6 string → [lat, lng][] */
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    for (const isLng of [false, true]) {
      let result = 0
      let shift = 0
      let b: number
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (isLng) lng += delta
      else lat += delta
    }
    coords.push([lat / 1e6, lng / 1e6])
  }
  return coords
}

// Module-level route cache: key → [lat, lon][] (only successful routes are cached)
const routeCache = new Map<string, [number, number][]>()

function cacheKey(from: LatLng, to: LatLng): string {
  return `${from.lat.toFixed(5)},${from.lng.toFixed(5)}-${to.lat.toFixed(5)},${to.lng.toFixed(5)}`
}

/**
 * Fetch a walking route from Valhalla (valhalla1.openstreetmap.de) — no key required.
 * Returns an array of [lat, lng] pairs (Leaflet format), following actual streets.
 * Only successful results are cached so failed routes will retry.
 */
export async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<[number, number][] | null> {
  const key = cacheKey(from, to)
  const cached = routeCache.get(key)
  if (cached) return cached

  try {
    const body = JSON.stringify({
      locations: [
        { lon: from.lng, lat: from.lat },
        { lon: to.lng, lat: to.lat },
      ],
      costing: 'pedestrian',
    })
    const res = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) throw new Error(`Valhalla ${res.status}`)
    const data = (await res.json()) as {
      trip: { legs: { shape: string }[] }
    }
    const encoded = data.trip.legs[0].shape
    const coords = decodePolyline6(encoded)
    routeCache.set(key, coords)
    return coords
  } catch {
    // Don't cache failures — allow retry on next render
    return null
  }
}

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 200
const RETRY_DELAY_MS = 600
const MAX_RETRIES = 3

/**
 * Fetch multiple route segments in small batches to avoid rate-limiting.
 * Retries failed segments up to MAX_RETRIES times with increasing delays.
 * Returns results in the same order as segments. Truly unresolvable routes return null.
 */
export async function fetchRoutesInBatches(
  segments: RouteSegment[],
): Promise<([number, number][] | null)[]> {
  const results: ([number, number][] | null)[] = new Array(segments.length).fill(null)
  // Track which indices still need fetching
  let pending = segments.map((_, i) => i)

  for (let attempt = 0; attempt < MAX_RETRIES && pending.length > 0; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }

    const nextPending: number[] = []

    for (let b = 0; b < pending.length; b += BATCH_SIZE) {
      const batchIndices = pending.slice(b, b + BATCH_SIZE)
      const batchResults = await Promise.all(
        batchIndices.map((i) => fetchOsrmRoute(segments[i].from, segments[i].to)),
      )
      for (let j = 0; j < batchResults.length; j++) {
        const idx = batchIndices[j]
        if (batchResults[j] !== null) {
          results[idx] = batchResults[j]
        } else {
          nextPending.push(idx)
        }
      }
      if (b + BATCH_SIZE < pending.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    pending = nextPending
  }

  return results
}

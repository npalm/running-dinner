import { describe, it, expect } from 'vitest'
import {
  haversineDistance,
  areNeighbors,
  generateOsmLink,
  randomPointInRing,
  buildNeighborGraph,
  wgs84ToRd,
} from './coordinates'
import type { Participant } from '../types'

function makeParticipant(id: string, lat: number, lng: number): Participant {
  return {
    id,
    name: `Participant ${id}`,
    count: 1,
    address: 'Test Street 1, City',
    coordinates: { lat, lng },
    preference: null,
  }
}

describe('haversineDistance', () => {
  it('returns ~0 for identical coordinates', () => {
    const a = { lat: 52.3676, lng: 4.9041 }
    expect(haversineDistance(a, a)).toBeCloseTo(0, 1)
  })

  it('returns ~111km for 1 degree latitude difference', () => {
    const a = { lat: 51.0, lng: 5.0 }
    const b = { lat: 52.0, lng: 5.0 }
    const dist = haversineDistance(a, b)
    // 1 degree latitude ≈ 111,195 m
    expect(dist).toBeGreaterThan(111_000 * 0.95)
    expect(dist).toBeLessThan(111_000 * 1.05)
  })

  it('returns ~333m for two nearby Eindhoven points', () => {
    // Two points roughly 333 m apart
    const a = { lat: 51.4416, lng: 5.4697 }
    const b = { lat: 51.4446, lng: 5.4697 } // ~0.003 deg lat ≈ 333 m
    const dist = haversineDistance(a, b)
    expect(dist).toBeGreaterThan(300)
    expect(dist).toBeLessThan(380)
  })

  it('is symmetric', () => {
    const a = { lat: 51.4416, lng: 5.4697 }
    const b = { lat: 51.4700, lng: 5.5000 }
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 5)
  })
})

describe('areNeighbors', () => {
  it('returns true for points within 150 m', () => {
    const a = { lat: 51.4416, lng: 5.4697 }
    // ~100 m north
    const b = { lat: 51.4416 + 100 / 111_195, lng: 5.4697 }
    expect(areNeighbors(a, b)).toBe(true)
  })

  it('returns false for points further than 150 m', () => {
    const a = { lat: 51.4416, lng: 5.4697 }
    // ~500 m north
    const b = { lat: 51.4416 + 500 / 111_195, lng: 5.4697 }
    expect(areNeighbors(a, b)).toBe(false)
  })

  it('returns true when distance equals threshold', () => {
    // Two identical points: distance = 0, threshold default 150 m
    const a = { lat: 51.0, lng: 5.0 }
    expect(areNeighbors(a, a)).toBe(true)
  })

  it('respects custom threshold', () => {
    const a = { lat: 51.4416, lng: 5.4697 }
    // ~200 m north
    const b = { lat: 51.4416 + 200 / 111_195, lng: 5.4697 }
    expect(areNeighbors(a, b, 100)).toBe(false)
    expect(areNeighbors(a, b, 250)).toBe(true)
  })
})

describe('generateOsmLink', () => {
  it('generates a correct URL with default zoom', () => {
    const coords = { lat: 51.4416, lng: 5.4697 }
    const url = generateOsmLink(coords)
    expect(url).toBe(
      'https://www.openstreetmap.org/?mlat=51.4416&mlon=5.4697&zoom=17',
    )
  })

  it('generates a correct URL with custom zoom', () => {
    const coords = { lat: 52.3676, lng: 4.9041 }
    const url = generateOsmLink(coords, 12)
    expect(url).toBe(
      'https://www.openstreetmap.org/?mlat=52.3676&mlon=4.9041&zoom=12',
    )
  })

  it('contains mlat, mlon and zoom query params', () => {
    const coords = { lat: 51.0, lng: 5.0 }
    const url = generateOsmLink(coords)
    expect(url).toContain('mlat=51')
    expect(url).toContain('mlon=5')
    expect(url).toContain('zoom=')
  })
})

describe('randomPointInRing', () => {
  const center = { lat: 51.4595, lng: 5.4827 }
  const minM = 200
  const maxM = 1000

  it('generates points within [minM, maxM] from center (20 samples)', () => {
    for (let i = 0; i < 20; i++) {
      const point = randomPointInRing(center, minM, maxM)
      const dist = haversineDistance(center, point)
      expect(dist).toBeGreaterThanOrEqual(minM * 0.95)
      expect(dist).toBeLessThanOrEqual(maxM * 1.05)
    }
  })

  it('generates valid lat/lng values', () => {
    for (let i = 0; i < 10; i++) {
      const point = randomPointInRing(center, minM, maxM)
      expect(point.lat).toBeGreaterThan(-90)
      expect(point.lat).toBeLessThan(90)
      expect(point.lng).toBeGreaterThan(-180)
      expect(point.lng).toBeLessThan(180)
    }
  })
})

describe('buildNeighborGraph', () => {
  it('returns empty graph for empty participants', () => {
    const graph = buildNeighborGraph([])
    expect(graph.size).toBe(0)
  })

  it('marks two close participants as neighbors', () => {
    const a = makeParticipant('a', 51.4416, 5.4697)
    // ~50 m north
    const b = makeParticipant('b', 51.4416 + 50 / 111_195, 5.4697)
    const graph = buildNeighborGraph([a, b])
    expect(graph.get('a')!.has('b')).toBe(true)
    expect(graph.get('b')!.has('a')).toBe(true)
  })

  it('does not mark two far participants as neighbors', () => {
    const a = makeParticipant('a', 51.4416, 5.4697)
    // ~500 m north
    const b = makeParticipant('b', 51.4416 + 500 / 111_195, 5.4697)
    const graph = buildNeighborGraph([a, b])
    expect(graph.get('a')!.has('b')).toBe(false)
    expect(graph.get('b')!.has('a')).toBe(false)
  })

  it('excludes participants without coordinates', () => {
    const a = makeParticipant('a', 51.4416, 5.4697)
    const noCoords: Participant = {
      id: 'b',
      name: 'No Coords',
      count: 1,
      address: 'Unknown',
      coordinates: null,
      preference: null,
    }
    const graph = buildNeighborGraph([a, noCoords])
    expect(graph.has('b')).toBe(false)
    expect(graph.has('a')).toBe(true)
  })

  it('graph is symmetric', () => {
    const a = makeParticipant('a', 51.4416, 5.4697)
    const b = makeParticipant('b', 51.4416 + 50 / 111_195, 5.4697)
    const c = makeParticipant('c', 51.4416 + 500 / 111_195, 5.4697)
    const graph = buildNeighborGraph([a, b, c])
    expect(graph.get('a')!.has('b')).toBe(graph.get('b')!.has('a'))
    expect(graph.get('a')!.has('c')).toBe(graph.get('c')!.has('a'))
  })
})

describe('wgs84ToRd', () => {
  it('converts the RD origin correctly (~Amersfoort)', () => {
    // Amersfoort: 52.15517440°N, 5.38720621°E → RD ~(155000, 463000)
    const { X, Y } = wgs84ToRd({ lat: 52.15517440, lng: 5.38720621 })
    expect(X).toBeCloseTo(155000, -1)
    expect(Y).toBeCloseTo(463000, -1)
  })

  it('converts Eindhoven center approximately correctly', () => {
    // Eindhoven center ~51.441°N 5.478°E → RD roughly (162000, 392000)
    const { X, Y } = wgs84ToRd({ lat: 51.441, lng: 5.478 })
    expect(X).toBeGreaterThan(155000)
    expect(X).toBeLessThan(175000)
    expect(Y).toBeGreaterThan(380000)
    expect(Y).toBeLessThan(400000)
  })

  it('returns higher X for more eastern coordinates', () => {
    const west = wgs84ToRd({ lat: 52.0, lng: 4.0 })
    const east = wgs84ToRd({ lat: 52.0, lng: 6.0 })
    expect(east.X).toBeGreaterThan(west.X)
  })

  it('returns higher Y for more northern coordinates', () => {
    const south = wgs84ToRd({ lat: 51.0, lng: 5.3 })
    const north = wgs84ToRd({ lat: 53.0, lng: 5.3 })
    expect(north.Y).toBeGreaterThan(south.Y)
  })
})

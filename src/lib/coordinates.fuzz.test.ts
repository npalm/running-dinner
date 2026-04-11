import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { haversineDistance, areNeighbors, randomPointInRing } from './coordinates'
import type { LatLng } from '../types'

const latLngArb: fc.Arbitrary<LatLng> = fc.record({
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true }),
})

const eindhoven: LatLng = { lat: 51.4416, lng: 5.4697 }

describe('haversineDistance properties', () => {
  it('is always non-negative', () => {
    fc.assert(
      fc.property(latLngArb, latLngArb, (a, b) => {
        expect(haversineDistance(a, b)).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  it('is symmetric: d(a,b) === d(b,a)', () => {
    fc.assert(
      fc.property(latLngArb, latLngArb, (a, b) => {
        const ab = haversineDistance(a, b)
        const ba = haversineDistance(b, a)
        expect(ab).toBeCloseTo(ba, 6)
      }),
    )
  })

  it('distance from a point to itself is zero', () => {
    fc.assert(
      fc.property(latLngArb, (a) => {
        expect(haversineDistance(a, a)).toBeCloseTo(0, 6)
      }),
    )
  })

  it('is bounded by max Earth diameter (~20015 km)', () => {
    fc.assert(
      fc.property(latLngArb, latLngArb, (a, b) => {
        expect(haversineDistance(a, b)).toBeLessThanOrEqual(20_015_100) // max great-circle distance in meters
      }),
    )
  })
})

describe('areNeighbors properties', () => {
  it('a point is always a neighbor of itself', () => {
    fc.assert(
      fc.property(latLngArb, (a) => {
        expect(areNeighbors(a, a)).toBe(true)
      }),
    )
  })

  it('is symmetric', () => {
    fc.assert(
      fc.property(latLngArb, latLngArb, (a, b) => {
        expect(areNeighbors(a, b)).toBe(areNeighbors(b, a))
      }),
    )
  })
})

describe('randomPointInRing properties', () => {
  it('result lies within [minM, maxM] of center', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 501, max: 2000 }),
        (minM, maxM) => {
          const result = randomPointInRing(eindhoven, minM, maxM)
          const dist = haversineDistance(eindhoven, result)
          expect(dist).toBeGreaterThanOrEqual(minM * 0.9) // 10% tolerance for floating point
          expect(dist).toBeLessThanOrEqual(maxM * 1.1)
        },
      ),
    )
  })

  it('always returns a valid LatLng', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 500 }),
        fc.integer({ min: 501, max: 3000 }),
        (minM, maxM) => {
          const result = randomPointInRing(eindhoven, minM, maxM)
          expect(result.lat).toBeGreaterThanOrEqual(-90)
          expect(result.lat).toBeLessThanOrEqual(90)
          expect(result.lng).toBeGreaterThanOrEqual(-180)
          expect(result.lng).toBeLessThanOrEqual(180)
        },
      ),
    )
  })
})

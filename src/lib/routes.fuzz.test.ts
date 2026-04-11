import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { decodePolyline6, buildUniqueSegments } from './routes'
import type { Journey } from './routes'

const latLngArb = fc.record({
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true }),
})

describe('decodePolyline6 properties', () => {
  it('never throws on arbitrary non-empty strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (s) => {
        // Must not throw regardless of input
        let threw = false
        try {
          decodePolyline6(s)
        } catch {
          threw = true
        }
        return !threw
      }),
    )
  })

  it('returns an array for any input', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = decodePolyline6(s)
        expect(Array.isArray(result)).toBe(true)
      }),
    )
  })

  it('each coord pair has exactly 2 numbers', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = decodePolyline6(s)
        for (const pair of result) {
          expect(pair).toHaveLength(2)
          expect(typeof pair[0]).toBe('number')
          expect(typeof pair[1]).toBe('number')
        }
      }),
    )
  })
})

describe('buildUniqueSegments properties', () => {
  const journeyArb: fc.Arbitrary<Journey> = fc.record({
    participantId: fc.uuid(),
    starter: fc.option(latLngArb, { nil: null }),
    main: fc.option(latLngArb, { nil: null }),
    dessert: fc.option(latLngArb, { nil: null }),
  })

  it('returns no duplicate from→to pairs', () => {
    fc.assert(
      fc.property(
        fc.array(journeyArb, { maxLength: 20 }),
        fc.constantFrom('both' as const, 'to-main' as const, 'to-dessert' as const),
        (journeys, filter) => {
          const segments = buildUniqueSegments(journeys, filter)
          const keys = segments.map(
            (s) =>
              `${s.from.lat.toFixed(5)},${s.from.lng.toFixed(5)}-${s.to.lat.toFixed(5)},${s.to.lng.toFixed(5)}`,
          )
          expect(new Set(keys).size).toBe(keys.length)
        },
      ),
    )
  })

  it('filter "to-main" only returns to-main segments', () => {
    fc.assert(
      fc.property(fc.array(journeyArb, { maxLength: 20 }), (journeys) => {
        const segments = buildUniqueSegments(journeys, 'to-main')
        expect(segments.every((s) => s.type === 'to-main')).toBe(true)
      }),
    )
  })

  it('filter "to-dessert" only returns to-dessert segments', () => {
    fc.assert(
      fc.property(fc.array(journeyArb, { maxLength: 20 }), (journeys) => {
        const segments = buildUniqueSegments(journeys, 'to-dessert')
        expect(segments.every((s) => s.type === 'to-dessert')).toBe(true)
      }),
    )
  })

  it('"both" returns a superset of each individual filter', () => {
    fc.assert(
      fc.property(fc.array(journeyArb, { maxLength: 20 }), (journeys) => {
        const both = buildUniqueSegments(journeys, 'both')
        const toMain = buildUniqueSegments(journeys, 'to-main')
        const toDessert = buildUniqueSegments(journeys, 'to-dessert')
        expect(both.length).toBeGreaterThanOrEqual(toMain.length)
        expect(both.length).toBeGreaterThanOrEqual(toDessert.length)
      }),
    )
  })
})

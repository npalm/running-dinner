import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { generateSchedule, validateSchedule, selectTargetSize } from './schedule'
import type { Participant, CookingPreference, LatLng } from '../types'

const coordArb: fc.Arbitrary<LatLng> = fc.record({
  lat: fc.float({ min: Math.fround(51.3), max: Math.fround(51.6), noNaN: true }),
  lng: fc.float({ min: Math.fround(5.2), max: Math.fround(5.7), noNaN: true }),
})

const preferenceArb: fc.Arbitrary<CookingPreference> = fc.constantFrom(
  'starter',
  'main',
  'dessert',
  'prefer-not',
  null,
)

const participantArb: fc.Arbitrary<Participant> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  count: fc.constantFrom(1 as const, 2 as const, 3 as const),
  address: fc.string({ minLength: 1 }),
  coordinates: fc.option(coordArb, { nil: null }),
  preference: preferenceArb,
  canCook: fc.oneof({ weight: 4, arbitrary: fc.constant(true) }, { weight: 1, arbitrary: fc.constant(false) }),
  dietaryWishes: fc.option(fc.string(), { nil: undefined }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
})

// Generate a valid participant list: at least 6 participants for a non-trivial schedule
const participantsArb = fc.uniqueArray(participantArb, {
  minLength: 6,
  maxLength: 16,
  selector: (p) => p.id,
})

describe('generateSchedule properties', () => {
  it('every participant appears in at least one table', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const totalPersons = participants.reduce((s, p) => s + p.count, 0)
        const tablesPerCourse = Math.max(1, Math.round(totalPersons / 6))
        const cookableCount = participants.filter((p) => p.canCook).length
        fc.pre(cookableCount >= tablesPerCourse * 3)
        const schedule = generateSchedule(participants)
        const allIds = new Set([
          ...schedule.tables.map((t) => t.hostId),
          ...schedule.tables.flatMap((t) => t.guestIds),
        ])
        for (const p of participants) {
          expect(allIds.has(p.id)).toBe(true)
        }
      }),
      { numRuns: 5 },
    )
  })

  it('no participant hosts more than one table', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const schedule = generateSchedule(participants)
        const hostIds = schedule.tables.map((t) => t.hostId)
        expect(new Set(hostIds).size).toBe(hostIds.length)
      }),
      { numRuns: 5 },
    )
  })

  it('validateSchedule returns no errors for a freshly generated schedule', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const totalPersons = participants.reduce((s, p) => s + p.count, 0)
        const tablesPerCourse = Math.max(1, Math.round(totalPersons / 6))
        const cookableCount = participants.filter((p) => p.canCook).length
        fc.pre(cookableCount >= tablesPerCourse * 3)
        const schedule = generateSchedule(participants)
        const errors = validateSchedule(schedule, participants)
        expect(errors).toHaveLength(0)
      }),
      { numRuns: 5, maxSkipsPerRun: 1000 },
    )
  })

  it('each table has exactly one course', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const schedule = generateSchedule(participants)
        for (const table of schedule.tables) {
          expect(['starter', 'main', 'dessert']).toContain(table.course)
        }
      }),
      { numRuns: 5 },
    )
  })

  it('generatedAt is a valid ISO date string', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const schedule = generateSchedule(participants)
        expect(() => new Date(schedule.generatedAt).toISOString()).not.toThrow()
      }),
      { numRuns: 3 },
    )
  })
})

describe('validateSchedule properties', () => {
  it('returns an array for any input', () => {
    fc.assert(
      fc.property(participantsArb, (participants) => {
        const schedule = generateSchedule(participants)
        const errors = validateSchedule(schedule, participants)
        expect(Array.isArray(errors)).toBe(true)
      }),
      { numRuns: 5 },
    )
  })
})

describe('selectTargetSize properties', () => {
  const strategyArb = fc.shuffledSubarray([4, 5, 6, 7, 8], { minLength: 1 })
  const totalArb = fc.integer({ min: 2, max: 200 })

  it('always returns a value from the strategy', () => {
    fc.assert(
      fc.property(totalArb, strategyArb, (total, strategy) => {
        const result = selectTargetSize(total, strategy)
        expect(strategy).toContain(result.targetSize)
        expect(result.tablesPerCourse).toBeGreaterThanOrEqual(1)
      }),
      { numRuns: 100 },
    )
  })

  it('generates valid schedules with any strategy', () => {
    fc.assert(
      fc.property(participantsArb, strategyArb, (participants, strategy) => {
        const cookCount = participants.filter((p) => p.canCook !== false).length
        fc.pre(cookCount >= 3)
        const schedule = generateSchedule(participants, strategy)
        const courseNames = [...new Set(schedule.tables.map((t) => t.course))]
        expect(courseNames).toHaveLength(3)
        for (const name of courseNames) {
          const tables = schedule.tables.filter((t) => t.course === name)
          expect(tables.length).toBeGreaterThanOrEqual(1)
        }
      }),
      { numRuns: 10, maxSkipsPerRun: 1000 },
    )
  })
})

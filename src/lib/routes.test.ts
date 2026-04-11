import { describe, it, expect } from 'vitest'
import { buildJourneys, buildUniqueSegments } from './routes'
import type { Schedule, Participant } from '../types'

function makeParticipant(id: string, lat: number, lng: number): Participant {
  return {
    id,
    name: `Person ${id}`,
    count: 1,
    address: `Street ${id}`,
    coordinates: { lat, lng },
    preference: null,
  }
}

const A = makeParticipant('A', 51.40, 5.40)
const B = makeParticipant('B', 51.41, 5.41)
const C = makeParticipant('C', 51.42, 5.42)

const schedule: Schedule = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  tables: [
    { id: 'T1', hostId: 'A', course: 'starter',  guestIds: ['B', 'C'] },
    { id: 'T2', hostId: 'B', course: 'main',     guestIds: ['A', 'C'] },
    { id: 'T3', hostId: 'C', course: 'dessert',  guestIds: ['A', 'B'] },
  ],
}

describe('buildJourneys', () => {
  it('returns one journey per participant', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    expect(journeys).toHaveLength(3)
    const ids = journeys.map((j) => j.participantId).sort()
    expect(ids).toEqual(['A', 'B', 'C'])
  })

  it('host stays at their own coordinates for their course', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    const aJourney = journeys.find((j) => j.participantId === 'A')!
    expect(aJourney.starter).toEqual(A.coordinates)
  })

  it('guest visits host coordinates for the course they attend', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    const bJourney = journeys.find((j) => j.participantId === 'B')!
    // B is a guest at A's starter → should get A's coords
    expect(bJourney.starter).toEqual(A.coordinates)
    // B is the host for main → B's own coords
    expect(bJourney.main).toEqual(B.coordinates)
    // B is a guest at C's dessert → C's coords
    expect(bJourney.dessert).toEqual(C.coordinates)
  })

  it('returns null coordinates when participant has no assignment for that course', () => {
    const partialSchedule: Schedule = {
      generatedAt: '',
      tables: [{ id: 'T1', hostId: 'A', course: 'starter', guestIds: ['B'] }],
    }
    const journeys = buildJourneys(partialSchedule, [A, B])
    const aJourney = journeys.find((j) => j.participantId === 'A')!
    expect(aJourney.main).toBeNull()
    expect(aJourney.dessert).toBeNull()
  })

  it('handles participant without coordinates gracefully (null)', () => {
    const noCoords: Participant = { ...A, id: 'X', coordinates: null }
    const sched: Schedule = { generatedAt: '', tables: [{ id: 'T1', hostId: 'X', course: 'starter', guestIds: ['B'] }] }
    const journeys = buildJourneys(sched, [noCoords, B])
    const bJourney = journeys.find((j) => j.participantId === 'B')!
    expect(bJourney.starter).toBeNull()
  })

  it('returns empty array for empty participants', () => {
    const journeys = buildJourneys(schedule, [])
    expect(journeys).toHaveLength(0)
  })
})

describe('buildUniqueSegments', () => {
  it('filter "both" returns both to-main and to-dessert segments', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    const segs = buildUniqueSegments(journeys, 'both')
    const types = new Set(segs.map((s) => s.type))
    expect(types.has('to-main')).toBe(true)
    expect(types.has('to-dessert')).toBe(true)
  })

  it('filter "to-main" returns only to-main segments', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    const segs = buildUniqueSegments(journeys, 'to-main')
    expect(segs.every((s) => s.type === 'to-main')).toBe(true)
  })

  it('filter "to-dessert" returns only to-dessert segments', () => {
    const journeys = buildJourneys(schedule, [A, B, C])
    const segs = buildUniqueSegments(journeys, 'to-dessert')
    expect(segs.every((s) => s.type === 'to-dessert')).toBe(true)
  })

  it('deduplicates identical from→to pairs', () => {
    // Give B and C the same starter host (A) and same main host (B) → same to-main segment
    const sameJourneys = [
      { participantId: 'B', starter: A.coordinates!, main: B.coordinates!, dessert: null },
      { participantId: 'C', starter: A.coordinates!, main: B.coordinates!, dessert: null },
    ]
    const segs = buildUniqueSegments(sameJourneys, 'to-main')
    expect(segs).toHaveLength(1)
  })

  it('skips segments where from and to are identical (host staying put)', () => {
    const hostJourney = [
      { participantId: 'A', starter: A.coordinates!, main: A.coordinates!, dessert: null },
    ]
    const segs = buildUniqueSegments(hostJourney, 'to-main')
    expect(segs).toHaveLength(0)
  })

  it('skips segments where from or to is null', () => {
    const partial = [{ participantId: 'A', starter: null, main: B.coordinates!, dessert: null }]
    const segs = buildUniqueSegments(partial, 'to-main')
    expect(segs).toHaveLength(0)
  })

  it('returns empty array for empty journeys', () => {
    expect(buildUniqueSegments([], 'both')).toHaveLength(0)
  })
})

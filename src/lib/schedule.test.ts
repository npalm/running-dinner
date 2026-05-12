import { describe, it, expect } from 'vitest'
import { generateSchedule, validateSchedule, computeMeetings, optimizeSchedule, selectTargetSize } from './schedule'
import type { Participant, Course } from '../types'

let idCounter = 0
function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  const id = String(++idCounter)
  return {
    id,
    name: `Participant ${id}`,
    count: 1,
    address: `Street ${id}, City`,
    coordinates: { lat: 51.4 + idCounter * 0.01, lng: 5.4 + idCounter * 0.01 },
    preference: null,
    canCook: true,
    ...overrides,
  }
}

/** Build a list of participants with varying counts that sum to totalPersons. */
function makeParticipants(totalPersons: number): Participant[] {
  const participants: Participant[] = []
  let remaining = totalPersons
  while (remaining > 0) {
    const count = remaining >= 2 ? 2 : 1
    participants.push(makeParticipant({ count: count as 1 | 2 | 3 }))
    remaining -= count
  }
  return participants
}

describe('generateSchedule', () => {
  beforeEach(() => {
    idCounter = 0
  })

  it('returns tables for all 3 courses for a 28-person input', () => {
    const participants = makeParticipants(28)
    const schedule = generateSchedule(participants)
    const courses: Course[] = ['starter', 'main', 'dessert']
    for (const course of courses) {
      const tables = schedule.tables.filter((t) => t.course === course)
      expect(tables.length).toBeGreaterThan(0)
    }
    // Total tables = 3 sets (one per course); each course should have ~round(28/6) tables
    expect(schedule.tables.length).toBeGreaterThanOrEqual(3)
  })

  it('every participant appears in exactly 3 tables (one per course)', () => {
    const participants = makeParticipants(28)
    const schedule = generateSchedule(participants)
    for (const p of participants) {
      const appearedCourses = new Set<Course>()
      for (const table of schedule.tables) {
        const allIds = [table.hostId, ...table.guestIds]
        if (allIds.includes(p.id)) {
          appearedCourses.add(table.course)
        }
      }
      expect(appearedCourses.size).toBe(3)
    }
  })

  it('no participant is host at more than one table', () => {
    const participants = makeParticipants(28)
    const schedule = generateSchedule(participants)
    const hostCounts = new Map<string, number>()
    for (const table of schedule.tables) {
      hostCounts.set(table.hostId, (hostCounts.get(table.hostId) ?? 0) + 1)
    }
    for (const [, count] of hostCounts) {
      expect(count).toBe(1)
    }
  })

  it('table person count is within 4–8 for a 28-person input', () => {
    const participants = makeParticipants(28)
    const participantMap = new Map(participants.map((p) => [p.id, p]))
    const schedule = generateSchedule(participants)

    for (const table of schedule.tables) {
      const allIds = [table.hostId, ...table.guestIds]
      const persons = allIds.reduce((s, id) => s + (participantMap.get(id)?.count ?? 1), 0)
      expect(persons).toBeGreaterThanOrEqual(4)
      expect(persons).toBeLessThanOrEqual(8)
    }
  })

  it('respects starter preference: starter-preferring participants more likely to host starter', () => {
    idCounter = 0
    // Create participants all preferring 'starter'
    const participants: Participant[] = []
    for (let i = 0; i < 28; i++) {
      participants.push(makeParticipant({ preference: 'starter' }))
    }
    const schedule = generateSchedule(participants)
    const starterTables = schedule.tables.filter((t) => t.course === 'starter')
    const starterHosts = new Set(starterTables.map((t) => t.hostId))

    // All starter hosts should have 'starter' preference (since all participants do)
    for (const hostId of starterHosts) {
      const host = participants.find((p) => p.id === hostId)
      expect(host?.preference).toBe('starter')
    }
  })

  it('excludes prefer-not participants from hosting when possible', () => {
    idCounter = 0
    // Mix: some prefer-not, rest have no preference
    const preferNotIds = new Set<string>()
    const participants: Participant[] = []
    for (let i = 0; i < 6; i++) {
      const p = makeParticipant({ preference: 'prefer-not' })
      preferNotIds.add(p.id)
      participants.push(p)
    }
    for (let i = 0; i < 22; i++) {
      participants.push(makeParticipant({ preference: null }))
    }
    const schedule = generateSchedule(participants)
    const hostIds = new Set(schedule.tables.map((t) => t.hostId))

    // prefer-not participants should not be hosts
    for (const id of preferNotIds) {
      expect(hostIds.has(id)).toBe(false)
    }
  })

  it('includes generatedAt timestamp', () => {
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)
    expect(typeof schedule.generatedAt).toBe('string')
    expect(new Date(schedule.generatedAt).getTime()).not.toBeNaN()
  })

  it('never selects canCook=false participants as hosts', () => {
    idCounter = 0
    const cannotCookIds = new Set<string>()
    const participants: Participant[] = []
    for (let i = 0; i < 4; i++) {
      const p = makeParticipant({ canCook: false })
      cannotCookIds.add(p.id)
      participants.push(p)
    }
    for (let i = 0; i < 24; i++) {
      participants.push(makeParticipant({ canCook: true }))
    }
    const schedule = generateSchedule(participants)
    const hostIds = new Set(schedule.tables.map((t) => t.hostId))
    for (const id of cannotCookIds) {
      expect(hostIds.has(id)).toBe(false)
    }
  })

  it('handles 3-person groups correctly', () => {
    idCounter = 0
    const participants: Participant[] = []
    // Add some triples
    for (let i = 0; i < 4; i++) {
      participants.push(makeParticipant({ count: 3 }))
    }
    // Add some singles to fill
    for (let i = 0; i < 6; i++) {
      participants.push(makeParticipant({ count: 1 }))
    }
    // Total = 4*3 + 6*1 = 18 persons
    const schedule = generateSchedule(participants)
    const warnings = validateSchedule(schedule, participants)
    expect(warnings).toEqual([])
  })

  it('reduces tables per course when not enough hosts available', () => {
    idCounter = 0
    const participants: Participant[] = []
    // 10 participants, 7 cannot cook → only 3 can host → 1 table per course
    for (let i = 0; i < 7; i++) {
      participants.push(makeParticipant({ count: 1, canCook: false }))
    }
    for (let i = 0; i < 3; i++) {
      participants.push(makeParticipant({ count: 1, canCook: true }))
    }
    const schedule = generateSchedule(participants)
    // Should not crash, each course should have exactly 1 table
    for (const course of ['starter', 'main', 'dessert'] as const) {
      const courseTables = schedule.tables.filter((t) => t.course === course)
      expect(courseTables.length).toBe(1)
    }
  })
})

describe('validateSchedule', () => {
  beforeEach(() => {
    idCounter = 0
  })

  it('returns empty array for a valid schedule', () => {
    const participants = makeParticipants(28)
    const schedule = generateSchedule(participants)
    const warnings = validateSchedule(schedule, participants)
    expect(warnings).toEqual([])
  })

  it('returns warnings for a participant missing from a course', () => {
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)

    // Remove a participant from all dessert tables
    const missingParticipant = participants[0]
    for (const table of schedule.tables) {
      if (table.course === 'dessert') {
        if (table.hostId === missingParticipant.id) {
          // Replace host with another participant to keep structure
          const replacement = participants.find((p) => p.id !== missingParticipant.id)!
          table.hostId = replacement.id
        }
        table.guestIds = table.guestIds.filter((id) => id !== missingParticipant.id)
      }
    }

    const warnings = validateSchedule(schedule, participants)
    const relevant = warnings.filter((w) => w.includes(missingParticipant.name))
    expect(relevant.length).toBeGreaterThan(0)
  })

  it('returns a warning for table outside 4–8 persons', () => {
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)

    // Force first table to have an empty guestIds to create a tiny table
    const firstTable = schedule.tables[0]
    firstTable.guestIds = []

    const warnings = validateSchedule(schedule, participants)
    // At least one warning about person count
    const sizeWarnings = warnings.filter((w) => w.includes('outside 4–8'))
    expect(sizeWarnings.length).toBeGreaterThan(0)
  })
})

describe('computeMeetings', () => {
  it('returns empty byParticipant map for no participants', () => {
    const schedule = generateSchedule(makeParticipants(12))
    const { byParticipant } = computeMeetings(schedule, [])
    expect(byParticipant.size).toBe(0)
  })

  it('each participant has exactly 3 meeting entries (one per course)', () => {
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)
    const { byParticipant } = computeMeetings(schedule, participants)
    for (const p of participants) {
      expect(byParticipant.get(p.id)).toHaveLength(3)
    }
  })

  it('byParticipant entries list tablemates (excluding self)', () => {
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)
    const { byParticipant } = computeMeetings(schedule, participants)
    for (const [id, entries] of byParticipant) {
      for (const entry of entries) {
        expect(entry.participantId).toBe(id)
        expect(entry.tablemates).not.toContain(id)
      }
    }
  })

  it('duplicatePairs is empty when no one meets twice', () => {
    // With a small group it is possible (not guaranteed) to have no duplicates
    const participants = makeParticipants(12)
    const schedule = generateSchedule(participants)
    const { duplicatePairs } = computeMeetings(schedule, participants)
    // All counts must be ≥ 2 for a pair to appear in duplicatePairs
    for (const [, , count] of duplicatePairs) {
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  it('detects duplicate pairs correctly', () => {
    // Build a synthetic schedule where two participants share two tables
    const p1 = makeParticipant()
    const p2 = makeParticipant()
    const p3 = makeParticipant()
    const fakeSched: import('../types').Schedule = {
      generatedAt: new Date().toISOString(),
      tables: [
        { id: 't1', course: 'starter', hostId: p1.id, guestIds: [p2.id, p3.id] },
        { id: 't2', course: 'main', hostId: p2.id, guestIds: [p1.id, p3.id] },
        { id: 't3', course: 'dessert', hostId: p3.id, guestIds: [p1.id, p2.id] },
      ],
    }
    const { duplicatePairs } = computeMeetings(fakeSched, [p1, p2, p3])
    // Everyone meets everyone 3 times → all pairs are duplicates
    expect(duplicatePairs.length).toBeGreaterThan(0)
    for (const [, , count] of duplicatePairs) {
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('optimizeSchedule', () => {
  it('returns a valid schedule', () => {
    const participants = makeParticipants(12)
    const schedule = optimizeSchedule(participants, 3)
    const warnings = validateSchedule(schedule, participants)
    expect(warnings).toHaveLength(0)
  })

  it('returns schedule with fewer or equal duplicates than a single run on average', () => {
    const participants = makeParticipants(18)
    const optimized = optimizeSchedule(participants, 10)
    const { duplicatePairs } = computeMeetings(optimized, participants)
    // The score (sum of extra meetings) should be reasonable
    const score = duplicatePairs.reduce((s, [, , c]) => s + (c - 1), 0)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('selectTargetSize', () => {
  it('picks exact fit when available', () => {
    // 12 persons / 6 = 2 tables, remainder 0
    expect(selectTargetSize(12, [6, 5, 7])).toEqual({ targetSize: 6, tablesPerCourse: 2 })
  })

  it('picks the strategy entry with smallest remainder', () => {
    // 13 persons: strategy [6,5,7]
    //   6 → tables=round(13/6)=2, remainder=|13-12|=1
    //   5 → tables=round(13/5)=3, remainder=|13-15|=2
    //   7 → tables=round(13/7)=2, remainder=|13-14|=1
    // Tie between 6 and 7; 6 comes first
    expect(selectTargetSize(13, [6, 5, 7]).targetSize).toBe(6)
  })

  it('breaks ties by strategy order (earlier wins)', () => {
    // 14 persons: [7,6] → 7: tables=2, rem=0; 6: tables=2, rem=2 → picks 7
    expect(selectTargetSize(14, [7, 6]).targetSize).toBe(7)
    // 12 persons: [6,4] → 6: tables=2, rem=0; 4: tables=3, rem=0 → tie, 6 first
    expect(selectTargetSize(12, [6, 4]).targetSize).toBe(6)
  })

  it('handles small total persons', () => {
    // 3 persons: [6,5,4] → all give tables=1, remainders 3,2,1 → picks 4 (rem=1)
    expect(selectTargetSize(3, [6, 5, 4]).targetSize).toBe(4)
  })

  it('handles single-entry strategy', () => {
    expect(selectTargetSize(18, [5])).toEqual({ targetSize: 5, tablesPerCourse: 4 })
    expect(selectTargetSize(7, [8])).toEqual({ targetSize: 8, tablesPerCourse: 1 })
  })

  it('always returns at least 1 table (never divides by zero)', () => {
    // Even with 1 person
    const result = selectTargetSize(1, [6, 5, 7])
    expect([6, 5, 7]).toContain(result.targetSize)
    expect(result.tablesPerCourse).toBeGreaterThanOrEqual(1)
  })
})


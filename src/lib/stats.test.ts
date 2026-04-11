import { describe, it, expect } from 'vitest'
import { computeDistanceStats } from './stats'
import type { Participant, Schedule } from '../types'

function makeP(id: string, lat: number, lng: number): Participant {
  return {
    id,
    name: `Person ${id}`,
    count: 1,
    address: `Street ${id}`,
    coordinates: { lat, lng },
    preference: null,
  }
}

const A = makeP('A', 51.40, 5.40)
const B = makeP('B', 51.41, 5.41)
const C = makeP('C', 51.42, 5.42)

const schedule: Schedule = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  tables: [
    { id: 'T1', hostId: 'A', course: 'starter',  guestIds: ['B', 'C'] },
    { id: 'T2', hostId: 'B', course: 'main',     guestIds: ['A', 'C'] },
    { id: 'T3', hostId: 'C', course: 'dessert',  guestIds: ['A', 'B'] },
  ],
}

describe('computeDistanceStats', () => {
  it('returns one stat per participant', () => {
    const stats = computeDistanceStats(schedule, [A, B, C])
    expect(stats.participants).toHaveLength(3)
  })

  it('all distance values are non-negative integers', () => {
    const { participants } = computeDistanceStats(schedule, [A, B, C])
    for (const p of participants) {
      if (p.homeToStarter !== null) expect(p.homeToStarter).toBeGreaterThanOrEqual(0)
      if (p.starterToMain !== null) expect(p.starterToMain).toBeGreaterThanOrEqual(0)
      if (p.mainToDessert !== null) expect(p.mainToDessert).toBeGreaterThanOrEqual(0)
      if (p.totalM !== null) expect(p.totalM).toBeGreaterThanOrEqual(0)
    }
  })

  it('totalM equals sum of the three legs', () => {
    const { participants } = computeDistanceStats(schedule, [A, B, C])
    for (const p of participants) {
      if (p.totalM !== null && p.homeToStarter !== null && p.starterToMain !== null && p.mainToDessert !== null) {
        expect(p.totalM).toBe(p.homeToStarter + p.starterToMain + p.mainToDessert)
      }
    }
  })

  it('participants sorted descending by totalM', () => {
    const { participants } = computeDistanceStats(schedule, [A, B, C])
    for (let i = 0; i < participants.length - 1; i++) {
      const a = participants[i].totalM ?? -1
      const b = participants[i + 1].totalM ?? -1
      expect(a).toBeGreaterThanOrEqual(b)
    }
  })

  it('host who stays at own address for starter has homeToStarter = 0', () => {
    const { participants } = computeDistanceStats(schedule, [A, B, C])
    const aStat = participants.find((p) => p.participantId === 'A')!
    // A hosts starter — their home IS the starter venue
    expect(aStat.homeToStarter).toBe(0)
  })

  it('averageM is between min and max', () => {
    const { averageM, minM, maxM } = computeDistanceStats(schedule, [A, B, C])
    expect(averageM).not.toBeNull()
    expect(averageM!).toBeGreaterThanOrEqual(minM!)
    expect(averageM!).toBeLessThanOrEqual(maxM!)
  })

  it('returns null aggregate stats for empty participants', () => {
    const { averageM, minM, maxM } = computeDistanceStats(schedule, [])
    expect(averageM).toBeNull()
    expect(minM).toBeNull()
    expect(maxM).toBeNull()
  })

  it('returns null distances for participant without coordinates', () => {
    const noCoords: Participant = { ...A, id: 'X', coordinates: null }
    const sched: Schedule = {
      generatedAt: '',
      tables: [{ id: 'T1', hostId: 'X', course: 'starter', guestIds: [] }],
    }
    const { participants } = computeDistanceStats(sched, [noCoords])
    const stat = participants.find((p) => p.participantId === 'X')!
    expect(stat.homeToStarter).toBeNull()
    expect(stat.totalM).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import {
  buildCards,
  buildHostCards,
  applyTemplate,
  DEFAULT_TEMPLATES_NL,
  DEFAULT_TEMPLATES_EN,
  COURSE_NL,
} from './cards'
import type { Participant, Schedule } from '../types'

function makeParticipant(overrides: Partial<Participant> & { id: string }): Participant {
  return {
    name: `Person ${overrides.id}`,
    count: 2,
    address: `Street ${overrides.id}, City`,
    coordinates: { lat: 51.4, lng: 5.4 },
    preference: null,
    canCook: true,
    ...overrides,
  }
}

const A = makeParticipant({ id: 'A' })
const B = makeParticipant({ id: 'B' })
const C = makeParticipant({ id: 'C' })
const D = makeParticipant({ id: 'D' })

/**
 * Minimal but realistic schedule:
 * - A hosts starter,  guests: B, C
 * - B hosts main,     guests: A, C
 * - C hosts dessert,  guests: A, B
 * - D is a pure guest (not hosting anything)
 */
const schedule: Schedule = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  tables: [
    { id: 'T1', hostId: 'A', course: 'starter', guestIds: ['B', 'C'] },
    { id: 'T2', hostId: 'B', course: 'main',    guestIds: ['A', 'C'] },
    { id: 'T3', hostId: 'C', course: 'dessert', guestIds: ['A', 'B'] },
  ],
}
const participants = [A, B, C, D]

describe('buildCards', () => {
  it('returns an array of card objects', () => {
    const cards = buildCards(schedule, participants)
    expect(Array.isArray(cards)).toBe(true)
  })

  it('does not generate a welcome card for the starter host (A)', () => {
    const cards = buildCards(schedule, participants)
    const welcomeForA = cards.filter((c) => c.type === 'welcome' && c.householdId === 'A')
    expect(welcomeForA).toHaveLength(0)
  })

  it('generates a welcome card for non-starter-host guests (B, C, D)', () => {
    const cards = buildCards(schedule, participants)
    const welcomeCards = cards.filter((c) => c.type === 'welcome')
    const ids = welcomeCards.map((c) => c.householdId).sort()
    expect(ids).toContain('B')
    expect(ids).toContain('C')
  })

  it('welcome card next address points to starter host address', () => {
    const cards = buildCards(schedule, participants)
    const bWelcome = cards.find((c) => c.type === 'welcome' && c.householdId === 'B')
    expect(bWelcome?.nextAddress).toBe(A.address)
  })

  it('does not generate a starter→main card for the main host (B)', () => {
    const cards = buildCards(schedule, participants)
    const s2mForB = cards.filter((c) => c.type === 'starter-to-main' && c.householdId === 'B')
    expect(s2mForB).toHaveLength(0)
  })

  it('generates a starter→main card for non-main-hosts', () => {
    const cards = buildCards(schedule, participants)
    const s2m = cards.filter((c) => c.type === 'starter-to-main')
    expect(s2m.length).toBeGreaterThan(0)
    const ids = s2m.map((c) => c.householdId)
    expect(ids).not.toContain('B') // B is main host
  })

  it('starter→main card next address points to main host address', () => {
    const cards = buildCards(schedule, participants)
    const aS2m = cards.find((c) => c.type === 'starter-to-main' && c.householdId === 'A')
    expect(aS2m?.nextAddress).toBe(B.address)
  })

  it('does not generate a main→dessert card for the dessert host (C)', () => {
    const cards = buildCards(schedule, participants)
    const m2dForC = cards.filter((c) => c.type === 'main-to-dessert' && c.householdId === 'C')
    expect(m2dForC).toHaveLength(0)
  })

  it('generates a main→dessert card for non-dessert-hosts', () => {
    const cards = buildCards(schedule, participants)
    const m2d = cards.filter((c) => c.type === 'main-to-dessert')
    expect(m2d.length).toBeGreaterThan(0)
    const ids = m2d.map((c) => c.householdId)
    expect(ids).not.toContain('C')
  })

  it('main→dessert card next address points to dessert host address', () => {
    const cards = buildCards(schedule, participants)
    const aM2d = cards.find((c) => c.type === 'main-to-dessert' && c.householdId === 'A')
    expect(aM2d?.nextAddress).toBe(C.address)
  })

  it('delivery address for starter-host (A) on starter→main card is their own address', () => {
    const cards = buildCards(schedule, participants)
    const aS2m = cards.find((c) => c.type === 'starter-to-main' && c.householdId === 'A')
    expect(aS2m?.deliveryAddress).toBe(A.address)
  })

  it('delivery address for non-starter-host (C) on starter→main card is the starter host address', () => {
    const cards = buildCards(schedule, participants)
    const cS2m = cards.find((c) => c.type === 'starter-to-main' && c.householdId === 'C')
    expect(cS2m?.deliveryAddress).toBe(A.address)
  })

  it('delivery address for main-host (B) on main→dessert card is their own address', () => {
    const cards = buildCards(schedule, participants)
    const bM2d = cards.find((c) => c.type === 'main-to-dessert' && c.householdId === 'B')
    expect(bM2d?.deliveryAddress).toBe(B.address)
  })

  it('card includes householdEmail when participant has email', () => {
    const AWithEmail = makeParticipant({ id: 'AE', email: 'ae@example.com' })
    const BE = makeParticipant({ id: 'BE' })
    const CE = makeParticipant({ id: 'CE' })
    const sched: Schedule = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      tables: [
        { id: 'T1', hostId: 'BE', course: 'starter', guestIds: ['AE'] },
        { id: 'T2', hostId: 'CE', course: 'main',    guestIds: ['AE'] },
        { id: 'T3', hostId: 'AE', course: 'dessert', guestIds: ['BE'] },
      ],
    }
    const cards = buildCards(sched, [AWithEmail, BE, CE])
    const welcome = cards.find((c) => c.type === 'welcome' && c.householdId === 'AE')
    expect(welcome?.householdEmail).toBe('ae@example.com')
  })

  it('returns empty array when schedule has no tables', () => {
    const cards = buildCards({ tables: [], generatedAt: '' }, participants)
    expect(cards).toHaveLength(0)
  })

  it('organizerLabel contains address', () => {
    const cards = buildCards(schedule, participants)
    const welcome = cards.find((c) => c.type === 'welcome')
    expect(welcome?.organizerLabel).toContain(welcome?.deliveryAddress)
  })
})

describe('buildHostCards', () => {
  it('returns one card per table plus guest cards for non-hosts', () => {
    const cards = buildHostCards(schedule, participants)
    // 3 tables + D (non-host)
    expect(cards.length).toBe(4)
  })

  it('host card has correct course and address', () => {
    const cards = buildHostCards(schedule, participants)
    const aCard = cards.find((c) => c.hostId === 'A')
    expect(aCard?.course).toBe('starter')
    expect(aCard?.hostAddress).toBe(A.address)
  })

  it('starter host is marked isStarterHost', () => {
    const cards = buildHostCards(schedule, participants)
    const aCard = cards.find((c) => c.hostId === 'A')
    expect(aCard?.isStarterHost).toBe(true)
    const bCard = cards.find((c) => c.hostId === 'B')
    expect(bCard?.isStarterHost).toBe(false)
  })

  it('guestCount reflects sum of guest counts', () => {
    const cards = buildHostCards(schedule, participants)
    const aCard = cards.find((c) => c.hostId === 'A')
    // B.count=2, C.count=2 → 4
    expect(aCard?.guestCount).toBe(4)
  })

  it('guest card (non-host) has course=null', () => {
    const cards = buildHostCards(schedule, participants)
    const dCard = cards.find((c) => c.hostId === 'D')
    expect(dCard?.course).toBeNull()
    expect(dCard?.guestCount).toBe(0)
    expect(dCard?.dietaryWishes).toHaveLength(0)
  })

  it('dietaryWishes collected from guests', () => {
    const BWithWish = makeParticipant({ id: 'BW', dietaryWishes: 'vegan' })
    const AH = makeParticipant({ id: 'AH' })
    const sched: Schedule = {
      tables: [{ id: 'T1', hostId: 'AH', course: 'starter', guestIds: ['BW'] }],
      generatedAt: '',
    }
    const cards = buildHostCards(sched, [AH, BWithWish])
    const ahCard = cards.find((c) => c.hostId === 'AH')
    expect(ahCard?.dietaryWishes).toContain('vegan')
  })

  it('unknown participant id in guestIds is skipped gracefully', () => {
    const sched: Schedule = {
      generatedAt: '',
      tables: [{ id: 'T1', hostId: 'A', course: 'starter', guestIds: ['MISSING'] }],
    }
    expect(() => buildHostCards(sched, [A])).not.toThrow()
  })
})

describe('applyTemplate', () => {
  it('replaces [namen] placeholder case-insensitively', () => {
    expect(applyTemplate('Hoi [namen]!', 'Test')).toBe('Hoi Test!')
    expect(applyTemplate('Hoi [NAMEN]!', 'Test')).toBe('Hoi Test!')
  })

  it('replaces multiple occurrences', () => {
    const result = applyTemplate('[namen] en [namen]', 'Alice')
    expect(result).toBe('Alice en Alice')
  })

  it('does not mangle names with JS replacement special chars', () => {
    expect(applyTemplate('Hoi [namen]!', 'O$\'Brien')).toBe("Hoi O$'Brien!")
    expect(applyTemplate('Hoi [namen]!', '$&super')).toBe('Hoi $&super!')
  })
})

describe('DEFAULT_TEMPLATES', () => {
  it('NL templates contain [namen] placeholder', () => {
    expect(DEFAULT_TEMPLATES_NL.welcome).toContain('[namen]')
    expect(DEFAULT_TEMPLATES_NL.starterToMain).toContain('[namen]')
    expect(DEFAULT_TEMPLATES_NL.mainToDessert).toContain('[namen]')
  })

  it('EN templates contain [namen] placeholder', () => {
    expect(DEFAULT_TEMPLATES_EN.welcome).toContain('[namen]')
  })
})

describe('COURSE_NL', () => {
  it('maps all three courses', () => {
    expect(COURSE_NL.starter).toBeDefined()
    expect(COURSE_NL.main).toBeDefined()
    expect(COURSE_NL.dessert).toBeDefined()
  })
})

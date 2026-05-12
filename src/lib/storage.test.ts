import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveParticipants,
  loadParticipants,
  saveSchedule,
  loadSchedule,
  saveTestDataConfig,
  loadTestDataConfig,
  importData,
  exportData,
} from './storage'
import type { Participant, Schedule, TestDataConfig } from '../types'

const KEYS = {
  participants: 'running-dinner-participants',
  schedule: 'running-dinner-schedule',
  testDataConfig: 'running-dinner-testdata-config',
}

function makeParticipant(id: string): Participant {
  return {
    id,
    name: `Participant ${id}`,
    count: 1,
    address: `Street ${id}, City`,
    coordinates: { lat: 51.4, lng: 5.4 },
    preference: null,
    canCook: true,
  }
}

function makeSchedule(): Schedule {
  return {
    tables: [
      {
        id: 'table-1',
        course: 'starter',
        hostId: 'p1',
        guestIds: ['p2', 'p3'],
      },
    ],
    generatedAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('saveParticipants / loadParticipants', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('round-trips an array of participants', () => {
    const participants = [makeParticipant('1'), makeParticipant('2')]
    saveParticipants(participants)
    const loaded = loadParticipants()
    expect(loaded).toEqual(participants)
  })

  it('returns empty array when nothing is stored', () => {
    expect(loadParticipants()).toEqual([])
  })

  it('overwrites previous data', () => {
    saveParticipants([makeParticipant('1')])
    saveParticipants([makeParticipant('2'), makeParticipant('3')])
    const loaded = loadParticipants()
    expect(loaded).toHaveLength(2)
    expect(loaded[0].id).toBe('2')
  })

  it('returns empty array on corrupted data', () => {
    localStorage.setItem(KEYS.participants, 'not valid json')
    expect(loadParticipants()).toEqual([])
  })
})

describe('saveSchedule / loadSchedule', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('round-trips a schedule', () => {
    const schedule = makeSchedule()
    saveSchedule(schedule)
    const loaded = loadSchedule()
    expect(loaded).toEqual(schedule)
  })

  it('returns null when nothing is stored', () => {
    expect(loadSchedule()).toBeNull()
  })

  it('removes schedule from storage when null is passed', () => {
    saveSchedule(makeSchedule())
    saveSchedule(null)
    expect(loadSchedule()).toBeNull()
    expect(localStorage.getItem(KEYS.schedule)).toBeNull()
  })

  it('returns null on corrupted data', () => {
    localStorage.setItem(KEYS.schedule, '{invalid json')
    expect(loadSchedule()).toBeNull()
  })
})

describe('loadTestDataConfig', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns defaults when nothing stored', () => {
    const config = loadTestDataConfig()
    expect(config.totalPersons).toBe(28)
    expect(config.singlesCount).toBe(2)
    expect(config.minRadiusM).toBe(5)
    expect(config.maxRadiusM).toBe(500)
    expect(config.baseAddress).toBe('Adolf van Cortenbachstraat, Eindhoven')
    expect(config.baseCoordinates).toEqual({ lat: 51.43440272, lng: 5.49144371 })
  })

  it('merges stored values with defaults', () => {
    localStorage.setItem(KEYS.testDataConfig, JSON.stringify({ totalPersons: 40, singlesCount: 6 }))
    const config = loadTestDataConfig()
    expect(config.totalPersons).toBe(40)
    expect(config.singlesCount).toBe(6)
    // defaults preserved for unset keys
    expect(config.minRadiusM).toBe(5)
    expect(config.maxRadiusM).toBe(500)
  })

  it('returns defaults on corrupted data', () => {
    localStorage.setItem(KEYS.testDataConfig, 'bad json')
    const config = loadTestDataConfig()
    expect(config.totalPersons).toBe(28)
  })
})

describe('saveTestDataConfig / loadTestDataConfig', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('round-trips a custom config', () => {
    const config: TestDataConfig = {
      totalPersons: 50,
      singlesCount: 10,
      minRadiusM: 500,
      maxRadiusM: 2000,
      baseAddress: 'Dam 1, Amsterdam',
      baseCoordinates: { lat: 52.3731, lng: 4.8922 },
    }
    saveTestDataConfig(config)
    const loaded = loadTestDataConfig()
    expect(loaded.totalPersons).toBe(50)
    expect(loaded.singlesCount).toBe(10)
    expect(loaded.minRadiusM).toBe(500)
    expect(loaded.maxRadiusM).toBe(2000)
    expect(loaded.baseAddress).toBe('Dam 1, Amsterdam')
    expect(loaded.baseCoordinates).toEqual({ lat: 52.3731, lng: 4.8922 })
  })
})

describe('importData', () => {
  it('parses a valid export file', async () => {
    const payload = {
      participants: [makeParticipant('1')],
      schedule: makeSchedule(),
      exportedAt: '2024-01-01T00:00:00.000Z',
    }
    const file = new File([JSON.stringify(payload)], 'export.json', { type: 'application/json' })
    const result = await importData(file)
    expect(result.participants).toHaveLength(1)
    expect(result.schedule).toEqual(makeSchedule())
  })

  it('returns null schedule when schedule is missing in file', async () => {
    const payload = { participants: [makeParticipant('1')] }
    const file = new File([JSON.stringify(payload)], 'export.json', { type: 'application/json' })
    const result = await importData(file)
    expect(result.schedule).toBeNull()
  })

  it('throws on invalid JSON', async () => {
    const file = new File(['not json!!!'], 'bad.json', { type: 'application/json' })
    await expect(importData(file)).rejects.toThrow('Invalid JSON file')
  })

  it('throws when participants array is missing', async () => {
    const payload = { noParticipants: true }
    const file = new File([JSON.stringify(payload)], 'bad.json', { type: 'application/json' })
    await expect(importData(file)).rejects.toThrow('Invalid file format: missing participants array')
  })

  it('throws for non-object JSON', async () => {
    const file = new File([JSON.stringify([1, 2, 3])], 'bad.json', { type: 'application/json' })
    await expect(importData(file)).rejects.toThrow()
  })
})

describe('exportData', () => {
  it('creates an anchor element and triggers click', () => {
    const clicks: string[] = []
    const anchors: HTMLAnchorElement[] = []

    // Spy on URL APIs
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Spy on createElement to capture anchor creation
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {
          clicks.push((el as HTMLAnchorElement).href)
        })
        anchors.push(el as HTMLAnchorElement)
      }
      return el
    })

    const participant: Participant = {
      id: 'p1', name: 'Test', count: 1,
      address: 'Teststreet 1', coordinates: null, preference: null, canCook: true,
    }
    exportData([participant], null)

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(anchors[0].download).toBe('running-dinner-export.json')

    vi.restoreAllMocks()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestData } from './testdata'
import { haversineDistance } from './coordinates'
import type { TestDataConfig } from '../types'

vi.mock('./geocoding', () => ({
  reverseGeocode: vi.fn(async () => 'Teststraat 1, Eindhoven'),
  geocodeAddress: vi.fn(),
}))

const BASE_CONFIG: TestDataConfig = {
  totalPersons: 28,
  singlesCount: 4,
  minRadiusM: 200,
  maxRadiusM: 1000,
  baseAddress: 'Cortenbachstraat 92, Eindhoven',
  baseCoordinates: { lat: 51.4595, lng: 5.4827 },
}

describe('generateTestData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the correct total number of persons', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    expect(participants.reduce((s, p) => s + p.count, 0)).toBe(BASE_CONFIG.totalPersons)
  })

  it('returns the correct number of singles', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    expect(participants.filter((p) => p.count === 1).length).toBe(BASE_CONFIG.singlesCount)
  })

  it('returns the correct number of pairs', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    const expected = Math.floor((BASE_CONFIG.totalPersons - BASE_CONFIG.singlesCount) / 2)
    expect(participants.filter((p) => p.count === 2).length).toBe(expected)
  })

  it('all participants have coordinates', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    for (const p of participants) {
      expect(p.coordinates).not.toBeNull()
      expect(typeof p.coordinates!.lat).toBe('number')
      expect(typeof p.coordinates!.lng).toBe('number')
    }
  })

  it('all coordinates are within [minRadiusM, maxRadiusM] from base', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    for (const p of participants) {
      const dist = haversineDistance(BASE_CONFIG.baseCoordinates, p.coordinates!)
      expect(dist).toBeGreaterThanOrEqual(BASE_CONFIG.minRadiusM * 0.95)
      expect(dist).toBeLessThanOrEqual(BASE_CONFIG.maxRadiusM * 1.05)
    }
  })

  it('all participants have a valid unique id', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    const ids = new Set(participants.map((p) => p.id))
    expect(ids.size).toBe(participants.length)
  })

  it('all participants have a non-empty name', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    for (const p of participants) expect(p.name.trim().length).toBeGreaterThan(0)
  })

  it('all participants have a non-empty address', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    for (const p of participants) expect(p.address.trim().length).toBeGreaterThan(0)
  })

  it('works with all singles', async () => {
    const config = { ...BASE_CONFIG, totalPersons: 4, singlesCount: 4 }
    const participants = await generateTestData(config)
    expect(participants.reduce((s, p) => s + p.count, 0)).toBe(4)
    expect(participants.filter((p) => p.count === 1).length).toBe(4)
  })

  it('pairs have names joined with &', async () => {
    const participants = await generateTestData(BASE_CONFIG)
    for (const p of participants.filter((p) => p.count === 2)) {
      expect(p.name).toContain('&')
    }
  })

  it('uses reverse geocoded addresses', async () => {
    const { reverseGeocode } = await import('./geocoding')
    await generateTestData(BASE_CONFIG)
    expect(reverseGeocode).toHaveBeenCalled()
  })
})

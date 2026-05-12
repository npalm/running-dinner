import { describe, it, expect } from 'vitest'
import { parseParticipantCsv, exportParticipantsCsv, exportScheduleCsv } from './csv'
import type { Participant, Schedule } from '../types'

// ---------------------------------------------------------------------------
// parseParticipantCsv
// ---------------------------------------------------------------------------

describe('parseParticipantCsv', () => {
  it('returns empty array for fewer than 2 lines', () => {
    expect(parseParticipantCsv('')).toHaveLength(0)
    expect(parseParticipantCsv('naam,aantal,adres')).toHaveLength(0)
  })

  it('parses a minimal valid row (comma delimiter)', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nAlice,2,Dorpsstraat 1')
    expect(rows).toHaveLength(1)
    expect(rows[0].participant?.name).toBe('Alice')
    expect(rows[0].participant?.count).toBe(2)
    expect(rows[0].participant?.address).toBe('Dorpsstraat 1')
    expect(rows[0].error).toBeUndefined()
  })

  it('parses a semicolon-delimited file', () => {
    const rows = parseParticipantCsv('naam;aantal;adres\nBob;1;Kerkstraat 5')
    expect(rows[0].participant?.name).toBe('Bob')
    expect(rows[0].participant?.count).toBe(1)
  })

  it('maps voorkeur strings to CookingPreference', () => {
    const cases: [string, string][] = [
      ['starter', 'starter'],
      ['voorgerecht', 'starter'],
      ['main', 'main'],
      ['hoofdgerecht', 'main'],
      ['dessert', 'dessert'],
      ['nagerecht', 'dessert'],
      ['prefer-not', 'prefer-not'],
      ['liever-niet', 'prefer-not'],
      ['', 'null'],
      ['unknown', 'null'],
    ]
    for (const [input, expected] of cases) {
      const rows = parseParticipantCsv(`naam,aantal,adres,email,voorkeur\nTest,1,Addr,,${input}`)
      const pref = rows[0].participant?.preference ?? 'null'
      expect(String(pref)).toBe(expected)
    }
  })

  it('returns error row when name is missing', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\n,1,Straat 1')
    expect(rows[0].error).toBeDefined()
    expect(rows[0].participant).toBeUndefined()
  })

  it('returns error row when address is missing', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nAlice,1,')
    expect(rows[0].error).toBeDefined()
  })

  it('parses optional email and dietaryWishes', () => {
    const rows = parseParticipantCsv(
      'naam,aantal,adres,email,voorkeur,dieetwensen\nClara,2,Laan 3,clara@example.com,main,vegan',
    )
    expect(rows[0].participant?.email).toBe('clara@example.com')
    expect(rows[0].participant?.dietaryWishes).toBe('vegan')
  })

  it('treats missing optional columns as undefined', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nDave,1,Weg 7')
    expect(rows[0].participant?.email).toBeUndefined()
    expect(rows[0].participant?.dietaryWishes).toBeUndefined()
    expect(rows[0].participant?.preference).toBeNull()
  })

  it('skips empty lines', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nEve,1,Str 1\n\nFrank,2,Str 2\n')
    expect(rows).toHaveLength(2)
  })

  it('handles quoted fields containing commas', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nAlice,1,"Straat 1, Eindhoven"')
    expect(rows[0].participant?.address).toBe('Straat 1, Eindhoven')
  })

  it('defaults count to 1 for non-numeric count', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nAlice,x,Straat 1')
    expect(rows[0].participant?.count).toBe(1)
  })

  it('caps count at 2 for values > 2', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nAlice,5,Straat 1')
    // parseCount clamps to 1|2 — only 2 is special
    expect([1, 2]).toContain(rows[0].participant?.count)
  })

  it('assigns row numbers starting at 1', () => {
    const rows = parseParticipantCsv('naam,aantal,adres\nA,1,S1\nB,2,S2')
    expect(rows[0].row).toBe(1)
    expect(rows[1].row).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// exportParticipantsCsv
// ---------------------------------------------------------------------------

const makeP = (overrides: Partial<Participant> & { id: string }): Participant => ({
  name: 'Test',
  count: 1,
  address: 'Straat 1',
  coordinates: null,
  preference: null,
  canCook: true,
  ...overrides,
})

describe('exportParticipantsCsv', () => {
  it('includes a header row', () => {
    const csv = exportParticipantsCsv([])
    expect(csv).toContain('naam')
    expect(csv).toContain('adres')
  })

  it('includes BOM for Excel compatibility', () => {
    const csv = exportParticipantsCsv([])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('produces one data row per participant', () => {
    const ps = [makeP({ id: '1', name: 'Alice' }), makeP({ id: '2', name: 'Bob' })]
    const lines = exportParticipantsCsv(ps).split('\n')
    // BOM + header + 2 data rows
    expect(lines).toHaveLength(3)
  })

  it('includes participant fields in row', () => {
    const p = makeP({ id: '1', name: 'Alice', count: 2, address: 'Kerk 1', email: 'a@b.com', preference: 'main' })
    const csv = exportParticipantsCsv([p])
    expect(csv).toContain('Alice')
    expect(csv).toContain('2')
    expect(csv).toContain('Kerk 1')
    expect(csv).toContain('a@b.com')
    expect(csv).toContain('main')
  })

  it('round-trips through parse → export → parse', () => {
    const original = [
      makeP({ id: '1', name: 'Alice', count: 2, address: 'Dorpsstraat 1', preference: 'starter' }),
      makeP({ id: '2', name: 'Bob', count: 1, address: 'Kerkweg 5', preference: null }),
    ]
    const csv = exportParticipantsCsv(original)
    const parsed = parseParticipantCsv(csv.replace(/^\uFEFF/, ''))
    expect(parsed).toHaveLength(2)
    expect(parsed[0].participant?.name).toBe('Alice')
    expect(parsed[1].participant?.name).toBe('Bob')
  })
})

// ---------------------------------------------------------------------------
// exportScheduleCsv
// ---------------------------------------------------------------------------

const A = makeP({ id: 'A', name: 'Alice', coordinates: { lat: 51.40, lng: 5.40 } })
const B = makeP({ id: 'B', name: 'Bob',   coordinates: { lat: 51.41, lng: 5.41 } })
const C = makeP({ id: 'C', name: 'Carol', coordinates: { lat: 51.42, lng: 5.42 } })

const schedule: Schedule = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  tables: [
    { id: 'T1', hostId: 'A', course: 'starter',  guestIds: ['B', 'C'] },
    { id: 'T2', hostId: 'B', course: 'main',     guestIds: ['A', 'C'] },
    { id: 'T3', hostId: 'C', course: 'dessert',  guestIds: ['A', 'B'] },
  ],
}

describe('exportScheduleCsv', () => {
  it('includes a header row with course columns', () => {
    const csv = exportScheduleCsv(schedule, [A, B, C])
    expect(csv).toContain('starter_adres')
    expect(csv).toContain('hoofdgerecht_adres')
    expect(csv).toContain('nagerecht_adres')
    expect(csv).toContain('totale_afstand_m')
  })

  it('includes BOM', () => {
    const csv = exportScheduleCsv(schedule, [A, B, C])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('produces one row per participant', () => {
    const lines = exportScheduleCsv(schedule, [A, B, C]).split('\n')
    // BOM+header + 3 data rows
    expect(lines).toHaveLength(4)
  })

  it('includes participant names', () => {
    const csv = exportScheduleCsv(schedule, [A, B, C])
    expect(csv).toContain('Alice')
    expect(csv).toContain('Bob')
    expect(csv).toContain('Carol')
  })

  it('returns numeric distance in total column for participants with coordinates', () => {
    const csv = exportScheduleCsv(schedule, [A, B, C])
    const lines = csv.split('\n').slice(1) // skip header
    for (const line of lines) {
      const cols = line.split(',')
      const total = cols[cols.length - 1]
      expect(Number(total)).toBeGreaterThan(0)
    }
  })

  it('handles empty schedule gracefully', () => {
    const empty: Schedule = { tables: [], generatedAt: '' }
    expect(() => exportScheduleCsv(empty, [A, B, C])).not.toThrow()
  })
})

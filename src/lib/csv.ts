import type { CookingPreference, Participant, Schedule } from '../types'
import { buildJourneys } from './routes'
import { haversineDistance } from './coordinates'

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/** Split a single CSV line respecting double-quoted fields. */
function splitCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const cols: string[] = []
  let current = ''
  let inQuote = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else if (ch === '"') {
        inQuote = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuote = true
    } else if (ch === delimiter) {
      cols.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}
function detectDelimiter(firstLine: string): ',' | ';' {
  const commas = (firstLine.match(/,/g) ?? []).length
  const semis = (firstLine.match(/;/g) ?? []).length
  return semis > commas ? ';' : ','
}

function parsePreference(raw: string): CookingPreference {
  const s = raw.trim().toLowerCase()
  if (s === 'starter' || s === 'voorgerecht') return 'starter'
  if (s === 'main' || s === 'hoofdgerecht') return 'main'
  if (s === 'dessert' || s === 'nagerecht') return 'dessert'
  if (s === 'prefer-not' || s === 'liever-niet') return 'prefer-not'
  return null
}

function parseCount(raw: string): 1 | 2 {
  const n = parseInt(raw.trim(), 10)
  return n === 2 ? 2 : 1
}

export interface ParsedParticipantRow {
  /** Row number in original file (1-based, excluding header). */
  row: number
  /** Parsed participant if valid. */
  participant?: Omit<Participant, 'id' | 'coordinates'>
  /** Error message if the row could not be parsed. */
  error?: string
}

/**
 * Parse a CSV text into participant rows.
 *
 * Expected columns (order matters, header row required):
 *   naam, aantal, adres, email (optional), voorkeur (optional), dieetwensen (optional)
 *
 * Accepts comma or semicolon as delimiter, auto-detected from the header.
 */
export function parseParticipantCsv(text: string): ParsedParticipantRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) return []

  const delimiter = detectDelimiter(lines[0])

  // Skip header row
  const dataLines = lines.slice(1)

  return dataLines.map((line, i) => {
    const row = i + 1
    const cols = splitCsvLine(line, delimiter)

    const name = cols[0] ?? ''
    const countRaw = cols[1] ?? '1'
    const address = cols[2] ?? ''

    if (!name) return { row, error: `Rij ${row}: naam ontbreekt` }
    if (!address) return { row, error: `Rij ${row}: adres ontbreekt` }

    const participant: Omit<Participant, 'id' | 'coordinates'> = {
      name,
      count: parseCount(countRaw),
      address,
      email: cols[3] || undefined,
      preference: parsePreference(cols[4] ?? ''),
      dietaryWishes: cols[5] || undefined,
    }

    return { row, participant }
  })
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvRow(values: (string | number | undefined)[]): string {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v)
      // Quote if contains comma, semicolon, quote, or newline
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    })
    .join(',')
}

/**
 * Export the current participant list as CSV.
 * Returns a UTF-8 CSV string with BOM for Excel compatibility.
 */
export function exportParticipantsCsv(participants: Participant[]): string {
  const header = csvRow(['naam', 'aantal', 'adres', 'email', 'voorkeur', 'dieetwensen'])
  const rows = participants.map((p) =>
    csvRow([p.name, p.count, p.address, p.email, p.preference ?? '', p.dietaryWishes]),
  )
  return '\uFEFF' + [header, ...rows].join('\n')
}

/**
 * Export the full schedule as CSV — one row per participant showing
 * which address they go to for each course.
 */
export function exportScheduleCsv(schedule: Schedule, participants: Participant[]): string {
  const pMap = new Map(participants.map((p) => [p.id, p]))

  // Build venue maps: for each course, participantId → hostId
  const venueHost = new Map<string, Map<string, string>>() // course → participantId → hostId
  for (const course of ['starter', 'main', 'dessert'] as const) {
    venueHost.set(course, new Map())
  }
  for (const table of schedule.tables) {
    venueHost.get(table.course)?.set(table.hostId, table.hostId)
    for (const guestId of table.guestIds) {
      venueHost.get(table.course)?.set(guestId, table.hostId)
    }
  }

  const getHost = (participantId: string, course: 'starter' | 'main' | 'dessert') => {
    const hostId = venueHost.get(course)?.get(participantId)
    return hostId ? pMap.get(hostId) : undefined
  }

  const journeys = buildJourneys(schedule, participants)
  const journeyMap = new Map(journeys.map((j) => [j.participantId, j]))

  const distM = (a: { lat: number; lng: number } | null, b: { lat: number; lng: number } | null) =>
    a && b ? Math.round(haversineDistance(a, b)) : ''

  const header = csvRow([
    'naam', 'email', 'thuis_adres',
    'starter_adres', 'starter_kok',
    'hoofdgerecht_adres', 'hoofdgerecht_kok',
    'nagerecht_adres', 'nagerecht_kok',
    'totale_afstand_m',
  ])

  const rows = participants.map((p) => {
    const j = journeyMap.get(p.id)
    const starterHost = getHost(p.id, 'starter')
    const mainHost = getHost(p.id, 'main')
    const dessertHost = getHost(p.id, 'dessert')

    const d1 = distM(p.coordinates, j?.starter ?? null)
    const d2 = distM(j?.starter ?? null, j?.main ?? null)
    const d3 = distM(j?.main ?? null, j?.dessert ?? null)
    const total =
      typeof d1 === 'number' && typeof d2 === 'number' && typeof d3 === 'number'
        ? d1 + d2 + d3
        : ''

    return csvRow([
      p.name, p.email, p.address,
      starterHost?.address ?? '', starterHost?.name ?? '',
      mainHost?.address ?? '', mainHost?.name ?? '',
      dessertHost?.address ?? '', dessertHost?.name ?? '',
      total,
    ])
  })

  return '\uFEFF' + [header, ...rows].join('\n')
}

/** Trigger a browser download of text content as a file. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

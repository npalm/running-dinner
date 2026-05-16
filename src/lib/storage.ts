import type { Participant, Schedule, TestDataConfig } from '../types'

const KEYS = {
  participants: 'running-dinner-participants',
  schedule: 'running-dinner-schedule',
  testDataConfig: 'running-dinner-testdata-config',
} as const

const DEFAULT_TEST_DATA_CONFIG: TestDataConfig = {
  totalPersons: 28,
  singlesCount: 2,
  minRadiusM: 5,
  maxRadiusM: 500,
  baseAddress: 'Adolf van Cortenbachstraat, Eindhoven',
  baseCoordinates: { lat: 51.43440272, lng: 5.49144371 },
}

export function saveParticipants(participants: Participant[]): void {
  localStorage.setItem(KEYS.participants, JSON.stringify(participants))
}

export function loadParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(KEYS.participants)
    if (!raw) return []
    return (JSON.parse(raw) as Participant[]).map(p => ({ ...p, canCook: p.canCook ?? true }))
  } catch {
    return []
  }
}

export function saveSchedule(schedule: Schedule | null): void {
  if (schedule === null) {
    localStorage.removeItem(KEYS.schedule)
  } else {
    localStorage.setItem(KEYS.schedule, JSON.stringify(schedule))
  }
}

export function loadSchedule(): Schedule | null {
  try {
    const raw = localStorage.getItem(KEYS.schedule)
    if (!raw) return null
    return JSON.parse(raw) as Schedule
  } catch {
    return null
  }
}

export function saveTestDataConfig(config: TestDataConfig): void {
  localStorage.setItem(KEYS.testDataConfig, JSON.stringify(config))
}

export function loadTestDataConfig(): TestDataConfig {
  try {
    const raw = localStorage.getItem(KEYS.testDataConfig)
    if (!raw) return { ...DEFAULT_TEST_DATA_CONFIG }
    return { ...DEFAULT_TEST_DATA_CONFIG, ...(JSON.parse(raw) as Partial<TestDataConfig>) }
  } catch {
    return { ...DEFAULT_TEST_DATA_CONFIG }
  }
}

/** Triggers a JSON file download containing participants and schedule. */
export function exportData(participants: Participant[], schedule: Schedule | null): void {
  const payload = { participants, schedule, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'running-dinner-export.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

interface ExportPayload {
  participants: Participant[]
  schedule?: Schedule | null
}

function isValidPayload(value: unknown): value is ExportPayload {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return Array.isArray(obj['participants'])
}

/** Parses an uploaded JSON file and returns validated participants and schedule. */
export async function importData(
  file: File,
): Promise<{ participants: Participant[]; schedule: Schedule | null }> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file')
  }
  if (!isValidPayload(parsed)) {
    throw new Error('Invalid file format: missing participants array')
  }
  return {
    participants: parsed.participants.map((p: Participant) => ({ ...p, canCook: p.canCook ?? true })),
    schedule: parsed.schedule ?? null,
  }
}

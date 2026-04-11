import type { Participant, Schedule } from '../types'
import { buildJourneys } from './routes'
import { haversineDistance } from './coordinates'

export interface ParticipantDistanceStat {
  participantId: string
  name: string
  /** Distance from home to starter venue (m), null if coordinates missing. */
  homeToStarter: number | null
  /** Distance from starter to main venue (m), null if coordinates missing. */
  starterToMain: number | null
  /** Distance from main to dessert venue (m), null if coordinates missing. */
  mainToDessert: number | null
  /** Sum of all legs (m), null if any leg is missing. */
  totalM: number | null
}

export interface DistanceStats {
  participants: ParticipantDistanceStat[]
  /** Average total distance across participants who have full data (m). */
  averageM: number | null
  /** Maximum total distance (m). */
  maxM: number | null
  /** Minimum total distance (m). */
  minM: number | null
}

function legDistance(
  a: { lat: number; lng: number } | null | undefined,
  b: { lat: number; lng: number } | null | undefined,
): number | null {
  if (!a || !b) return null
  return Math.round(haversineDistance(a, b))
}

/**
 * Compute per-participant walking distance estimates (straight-line haversine).
 * Legs: home → starter venue → main venue → dessert venue.
 */
export function computeDistanceStats(
  schedule: Schedule,
  participants: Participant[],
): DistanceStats {
  const pMap = new Map(participants.map((p) => [p.id, p]))
  const journeys = buildJourneys(schedule, participants)

  const stats: ParticipantDistanceStat[] = journeys.map((j) => {
    const p = pMap.get(j.participantId)
    const home = p?.coordinates ?? null

    const homeToStarter = legDistance(home, j.starter)
    const starterToMain = legDistance(j.starter, j.main)
    const mainToDessert = legDistance(j.main, j.dessert)

    const totalM =
      homeToStarter !== null && starterToMain !== null && mainToDessert !== null
        ? homeToStarter + starterToMain + mainToDessert
        : null

    return {
      participantId: j.participantId,
      name: p?.name ?? j.participantId,
      homeToStarter,
      starterToMain,
      mainToDessert,
      totalM,
    }
  })

  const totals = stats.map((s) => s.totalM).filter((v): v is number => v !== null)
  const averageM = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null
  const maxM = totals.length > 0 ? Math.max(...totals) : null
  const minM = totals.length > 0 ? Math.min(...totals) : null

  // Sort descending by total distance
  stats.sort((a, b) => (b.totalM ?? -1) - (a.totalM ?? -1))

  return { participants: stats, averageM, maxM, minM }
}

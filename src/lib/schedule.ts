import type { Course, Participant, Schedule, Table } from '../types'
import { buildNeighborGraph } from './coordinates'

const COURSES: Course[] = ['starter', 'main', 'dessert']
const TARGET_SIZE = 6
const MAX_SIZE = 8
const REPEAT_PENALTY = 50   // subtracted per person the guest has already met at a table
const NEIGHBOR_PENALTY = 200 // subtracted when host is a geographic neighbor

/** Score a participant as a host candidate for a given course. */
function hostScore(participant: Participant, course: Course): number {
  if (participant.preference === 'prefer-not') return 0
  if (participant.preference === course) return 3
  return 1
}

/**
 * Selects `count` hosts for a course.
 * Adds small random jitter to tied scores so repeated optimisation attempts
 * produce genuinely different host selections.
 */
function selectHosts(
  participants: Participant[],
  course: Course,
  count: number,
  alreadyHosting: Set<string>,
): Participant[] {
  return participants
    .filter((p) => !alreadyHosting.has(p.id))
    .map((p) => ({ p, score: hostScore(p, course) + Math.random() * 0.5 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((c) => c.p)
}

/**
 * Assigns non-host participants as guests to tables for one course.
 *
 * Primary goal: avoid repeat meetings (people who already shared a table).
 * Secondary goal: fill tables toward TARGET_SIZE (prefer 6, avoid 8).
 * Tertiary: avoid geographic neighbours at the same table.
 *
 * alreadyMet: participantId → Set of ids they've met in previous courses.
 */
function assignGuests(
  tables: Table[],
  nonHosts: Participant[],
  neighborGraph: Map<string, Set<string>>,
  alreadyMet: Map<string, Set<string>>,
  participants: Participant[],
): void {
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  const tablePersons = new Map<string, number>()
  // tableOccupants tracks who is currently at each table (host + guests assigned so far)
  const tableOccupants = new Map<string, string[]>()
  for (const t of tables) {
    const host = participantMap.get(t.hostId)
    tablePersons.set(t.id, host?.count ?? 1)
    tableOccupants.set(t.id, [t.hostId])
  }

  function scoreTable(table: Table, guest: Participant): number {
    const current = tablePersons.get(table.id) ?? 0
    if (current + guest.count > MAX_SIZE) return -Infinity

    const occupants = tableOccupants.get(table.id) ?? []
    const guestMet = alreadyMet.get(guest.id) ?? new Set<string>()
    const guestNeighbors = neighborGraph.get(guest.id) ?? new Set<string>()

    // Repeat-meeting penalty: count how many occupants the guest already met
    const repeatCount = occupants.filter((id) => guestMet.has(id)).length

    // Neighbor penalty
    const isNeighbor = guestNeighbors.has(table.hostId) ? 1 : 0

    // Size score: reward filling toward target, penalise overshoot
    const afterAdd = current + guest.count
    const toTarget = Math.max(0, TARGET_SIZE - current)
    const overshoot = Math.max(0, afterAdd - TARGET_SIZE)
    const sizeScore = toTarget - overshoot * 2

    return sizeScore - repeatCount * REPEAT_PENALTY - isNeighbor * NEIGHBOR_PENALTY
  }

  // Process pairs before singles for better bin-packing
  // Shuffle within each size group so order doesn't bias results
  const pairs = nonHosts.filter((p) => p.count === 2).sort(() => Math.random() - 0.5)
  const singles = nonHosts.filter((p) => p.count === 1).sort(() => Math.random() - 0.5)
  const guestList = [...pairs, ...singles]

  for (const guest of guestList) {
    // Pick the best-scoring table
    let best: Table | null = null
    let bestScore = -Infinity
    for (const table of tables) {
      const s = scoreTable(table, guest)
      if (s > bestScore) { bestScore = s; best = table }
    }
    if (best) {
      best.guestIds.push(guest.id)
      tablePersons.set(best.id, (tablePersons.get(best.id) ?? 0) + guest.count)
      tableOccupants.get(best.id)!.push(guest.id)
    }
  }
}

/** Build a met-graph from already-generated tables (for cross-course awareness). */
function buildMetGraph(tables: Table[]): Map<string, Set<string>> {
  const met = new Map<string, Set<string>>()
  const ensure = (id: string) => { if (!met.has(id)) met.set(id, new Set()); return met.get(id)! }
  for (const table of tables) {
    const all = [table.hostId, ...table.guestIds]
    for (const a of all) {
      for (const b of all) {
        if (a !== b) ensure(a).add(b)
      }
    }
  }
  return met
}

/**
 * Generates a Running Dinner schedule for all three courses.
 * Each participant hosts exactly one course and attends one table per course.
 * Uses cross-course meeting awareness to minimise repeat encounters.
 */
export function generateSchedule(participants: Participant[]): Schedule {
  const totalPersons = participants.reduce((s, p) => s + p.count, 0)
  const tablesPerCourse = Math.max(1, Math.round(totalPersons / TARGET_SIZE))
  const neighborGraph = buildNeighborGraph(participants)

  const tables: Table[] = []
  const alreadyHosting = new Set<string>()

  for (const course of COURSES) {
    const hosts = selectHosts(participants, course, tablesPerCourse, alreadyHosting)
    for (const host of hosts) alreadyHosting.add(host.id)

    const courseTables: Table[] = hosts.map((host) => ({
      id: crypto.randomUUID(),
      course,
      hostId: host.id,
      guestIds: [],
    }))

    const hostIds = new Set(hosts.map((h) => h.id))
    const nonHosts = participants.filter((p) => !hostIds.has(p.id))

    // Build met-graph from all courses so far so this course avoids repeating them
    const alreadyMet = buildMetGraph(tables)

    assignGuests(courseTables, nonHosts, neighborGraph, alreadyMet, participants)
    tables.push(...courseTables)
  }

  return { tables, generatedAt: new Date().toISOString() }
}

/**
 * Validates a generated schedule and returns an array of warning messages.
 * An empty array means the schedule is valid.
 */
export function validateSchedule(schedule: Schedule, participants: Participant[]): string[] {
  const warnings: string[] = []
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  // Count appearances per participant per course
  const appearances = new Map<string, Set<Course>>()
  for (const p of participants) appearances.set(p.id, new Set())

  for (const table of schedule.tables) {
    const allAtTable = [table.hostId, ...table.guestIds]
    const course = table.course

    // Table size
    const persons = allAtTable.reduce((s, id) => s + (participantMap.get(id)?.count ?? 1), 0)
    if (persons < 4 || persons > 8) {
      warnings.push(
        `Table ${table.id} (${course}) has ${persons} persons — outside 4–8 range.`,
      )
    }

    for (const id of allAtTable) {
      appearances.get(id)?.add(course)
    }
  }

  // Each participant should appear in all 3 courses
  for (const p of participants) {
    const courses = appearances.get(p.id)
    if (!courses || courses.size !== 3) {
      warnings.push(
        `Participant ${p.name} does not appear in all 3 courses (found: ${courses?.size ?? 0}).`,
      )
    }
  }

  return warnings
}

export interface MeetingEntry {
  participantId: string
  course: Course
  tablemates: string[] // participant ids they share this table with (excluding self)
}

export interface MeetingsSummary {
  /** For each participant: list of tablemates per course */
  byParticipant: Map<string, MeetingEntry[]>
  /** Pairs that meet more than once: [idA, idB, count] */
  duplicatePairs: Array<[string, string, number]>
}

/**
 * Computes who meets whom across all courses.
 * Returns per-participant meeting lists and duplicate-meeting pairs.
 */
export function computeMeetings(schedule: Schedule, participants: Participant[]): MeetingsSummary {
  const byParticipant = new Map<string, MeetingEntry[]>()
  for (const p of participants) byParticipant.set(p.id, [])

  for (const table of schedule.tables) {
    const allAtTable = [table.hostId, ...table.guestIds]
    for (const id of allAtTable) {
      if (!byParticipant.has(id)) continue
      byParticipant.get(id)!.push({
        participantId: id,
        course: table.course,
        tablemates: allAtTable.filter((other) => other !== id),
      })
    }
  }

  // Count pairwise meetings
  const pairCount = new Map<string, number>()
  for (const table of schedule.tables) {
    const allAtTable = [table.hostId, ...table.guestIds]
    for (let i = 0; i < allAtTable.length; i++) {
      for (let j = i + 1; j < allAtTable.length; j++) {
        const key = [allAtTable[i], allAtTable[j]].sort().join('::')
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1)
      }
    }
  }

  const duplicatePairs: Array<[string, string, number]> = []
  for (const [key, count] of pairCount) {
    if (count > 1) {
      const [a, b] = key.split('::')
      duplicatePairs.push([a, b, count])
    }
  }

  return { byParticipant, duplicatePairs }
}

/**
 * Runs `attempts` schedule generations and returns the one with the fewest
 * duplicate meeting pairs (people who share a table more than once).
 * This is a simple random-restart hill-climbing approach.
 */
export function optimizeSchedule(participants: Participant[], attempts = 30): Schedule {
  let best: Schedule | null = null
  let bestScore = Infinity

  for (let i = 0; i < attempts; i++) {
    const schedule = generateSchedule(participants)
    const { duplicatePairs } = computeMeetings(schedule, participants)
    // Score = total extra meetings (sum of (count-1) for each duplicate pair)
    const score = duplicatePairs.reduce((s, [, , count]) => s + (count - 1), 0)
    if (score < bestScore) {
      bestScore = score
      best = schedule
    }
    if (bestScore === 0) break  // perfect — everyone meets new people
  }

  return best!
}

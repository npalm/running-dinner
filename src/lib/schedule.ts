import type { Course, Participant, Schedule, Table, TableSizeStrategy } from '../types'
import { buildNeighborGraph } from './coordinates'

const COURSES: Course[] = ['starter', 'main', 'dessert']
const MAX_SIZE = 8

export const DEFAULT_STRATEGY: TableSizeStrategy = [6, 5, 7, 8, 4]

export function selectTargetSize(
  totalPersons: number,
  strategy: TableSizeStrategy = DEFAULT_STRATEGY,
): { targetSize: number; tablesPerCourse: number } {
  // Valid range of table counts: each table must seat 4–MAX_SIZE people
  const minTables = Math.max(1, Math.ceil(totalPersons / MAX_SIZE))
  const maxTables = Math.floor(totalPersons / 4)

  if (maxTables >= minTables) {
    // Try each strategy entry in priority order; first whose idealN
    // naturally falls in [minTables, maxTables] wins (no clamping needed).
    for (const target of strategy) {
      const idealN = Math.max(1, Math.round(totalPersons / target))
      if (idealN >= minTables && idealN <= maxTables) {
        return { targetSize: target, tablesPerCourse: idealN }
      }
    }
    // No entry fits naturally — fall back to smallest-remainder across all entries
  }

  // Fallback: pick the entry with smallest remainder (handles degenerate + no-natural-fit cases)
  let bestTarget = strategy[0]
  let bestTables = Math.max(1, Math.round(totalPersons / bestTarget))
  let bestRemainder = Math.abs(totalPersons - bestTables * bestTarget)

  for (let i = 1; i < strategy.length; i++) {
    const target = strategy[i]
    const tables = Math.max(1, Math.round(totalPersons / target))
    const remainder = Math.abs(totalPersons - tables * target)
    if (remainder < bestRemainder) {
      bestTarget = target
      bestTables = tables
      bestRemainder = remainder
    }
  }

  const n = maxTables >= 1
    ? Math.min(maxTables, Math.max(minTables, bestTables))
    : bestTables
  return { targetSize: bestTarget, tablesPerCourse: n }
}
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
    .filter((p) => !alreadyHosting.has(p.id) && p.canCook !== false)
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
  targetSize: number,
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
    const toTarget = Math.max(0, targetSize - current)
    const overshoot = Math.max(0, afterAdd - targetSize)
    const sizeScore = toTarget - overshoot * 2

    return sizeScore - repeatCount * REPEAT_PENALTY - isNeighbor * NEIGHBOR_PENALTY
  }

  // Process pairs before singles for better bin-packing
  // Shuffle within each size group so order doesn't bias results
  const triples = nonHosts.filter((p) => p.count === 3).sort(() => Math.random() - 0.5)
  const pairs = nonHosts.filter((p) => p.count === 2).sort(() => Math.random() - 0.5)
  const singles = nonHosts.filter((p) => p.count === 1).sort(() => Math.random() - 0.5)
  const guestList = [...triples, ...pairs, ...singles]

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
export function generateSchedule(
  participants: Participant[],
  strategy: TableSizeStrategy = DEFAULT_STRATEGY,
  allowVariableTables = true,
): Schedule {
  const totalPersons = participants.reduce((s, p) => s + p.count, 0)
  const { tablesPerCourse: initialTables } = selectTargetSize(totalPersons, strategy)
  const neighborGraph = buildNeighborGraph(participants)
  const warnings: string[] = []

  const cookableCount = participants.filter((p) => p.canCook !== false).length
  const totalTablesNeeded = initialTables * COURSES.length

  // Compute per-course table counts
  let tablesPerCourseArray: number[]

  if (totalTablesNeeded > cookableCount) {
    if (allowVariableTables) {
      // Distribute cookable hosts across courses: base + remainder
      const base = Math.floor(cookableCount / COURSES.length)
      const remainder = cookableCount % COURSES.length
      tablesPerCourseArray = COURSES.map((_, i) => (i < remainder ? base + 1 : base))
      tablesPerCourseArray = tablesPerCourseArray.map((n) => Math.max(n, 1))
      warnings.push(
        `Cook constraint: only ${cookableCount} hosts for ${COURSES.length} courses. ` +
        `Using variable table counts (${tablesPerCourseArray.join(', ')}) so everyone can cook.`,
      )
    } else {
      // Fall back to uniform reduction
      let tablesPerCourse = initialTables
      while (tablesPerCourse * COURSES.length > cookableCount && tablesPerCourse > 1) {
        tablesPerCourse--
      }
      tablesPerCourseArray = COURSES.map(() => tablesPerCourse)
      const nonCooking = cookableCount - tablesPerCourse * COURSES.length
      if (nonCooking > 0) {
        warnings.push(
          `Cook constraint: ${nonCooking} participant(s) will not host. ` +
          `Enable variable tables to allow everyone to cook.`,
        )
      }
    }
  } else {
    tablesPerCourseArray = COURSES.map(() => initialTables)
  }

  const tables: Table[] = []
  const alreadyHosting = new Set<string>()

  for (let ci = 0; ci < COURSES.length; ci++) {
    const course = COURSES[ci]
    const tablesThisCourse = tablesPerCourseArray[ci]

    const hosts = selectHosts(participants, course, tablesThisCourse, alreadyHosting)
    for (const host of hosts) alreadyHosting.add(host.id)

    const courseTables: Table[] = hosts.map((host) => ({
      id: crypto.randomUUID(),
      course,
      hostId: host.id,
      guestIds: [],
    }))

    const hostIds = new Set(hosts.map((h) => h.id))
    const nonHosts = participants.filter((p) => !hostIds.has(p.id))

    const alreadyMet = buildMetGraph(tables)

    // Recalculate target size for this course's table count
    const courseTargetSize = Math.max(4, Math.min(MAX_SIZE, Math.round(totalPersons / tablesThisCourse)))
    assignGuests(courseTables, nonHosts, neighborGraph, alreadyMet, participants, courseTargetSize)
    tables.push(...courseTables)
  }

  return { tables, generatedAt: new Date().toISOString(), warnings: warnings.length > 0 ? warnings : undefined }
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
export function optimizeSchedule(
  participants: Participant[],
  attempts = 30,
  strategy: TableSizeStrategy = DEFAULT_STRATEGY,
  allowVariableTables = true,
): Schedule {
  let best: Schedule | null = null
  let bestScore = Infinity

  for (let i = 0; i < attempts; i++) {
    const schedule = generateSchedule(participants, strategy, allowVariableTables)
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

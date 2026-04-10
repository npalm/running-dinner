import { create } from 'zustand'
import type { Participant, Schedule } from '../types'
import { loadSchedule, saveSchedule } from '../lib/storage'
import { generateSchedule, computeMeetings } from '../lib/schedule'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Run the schedule algorithm and show the animation for at least minMs. */
async function generateWithDelay(
  participants: Participant[],
  minMs = 2200,
): Promise<Schedule> {
  const [schedule] = await Promise.all([
    Promise.resolve(generateSchedule(participants)),
    sleep(minMs),
  ])
  return schedule
}

/**
 * Run `attempts` schedule generations in batches spread over time,
 * calling `onProgress` after each batch so the UI can show live progress.
 * Returns the best schedule found.
 */
async function optimizeWithProgress(
  participants: Participant[],
  attempts: number,
  batchSize: number,
  batchDelayMs: number,
  onProgress: (attempt: number, bestScore: number) => void,
): Promise<Schedule> {
  let best: Schedule | null = null
  let bestScore = Infinity
  let done = 0

  while (done < attempts) {
    const batch = Math.min(batchSize, attempts - done)
    for (let i = 0; i < batch; i++) {
      const schedule = generateSchedule(participants)
      const { duplicatePairs } = computeMeetings(schedule, participants)
      const score = duplicatePairs.reduce((s, [, , c]) => s + (c - 1), 0)
      if (score < bestScore) {
        bestScore = score
        best = schedule
      }
      done++
    }
    onProgress(done, bestScore)
    if (bestScore === 0) break
    if (done < attempts) await sleep(batchDelayMs)
  }

  return best!
}

interface ScheduleState {
  schedule: Schedule | null
  generating: boolean
  optimizing: boolean
  optimizeProgress: number   // 0-30 current attempt
  optimizeBestScore: number  // duplicate pairs in best so far
  generate: (participants: Participant[]) => void
  optimize: (participants: Participant[]) => void
  moveGuest: (guestId: string, fromTableId: string, toTableId: string) => void
  setSchedule: (s: Schedule | null) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedule: loadSchedule(),
  generating: false,
  optimizing: false,
  optimizeProgress: 0,
  optimizeBestScore: Infinity,

  generate(participants) {
    set({ generating: true })
    generateWithDelay(participants).then((schedule) => {
      saveSchedule(schedule)
      set({ schedule, generating: false })
    })
  },

  optimize(participants) {
    const ATTEMPTS = 30
    set({ optimizing: true, optimizeProgress: 0, optimizeBestScore: Infinity })
    optimizeWithProgress(
      participants,
      ATTEMPTS,
      3,           // 3 attempts per batch
      300,         // 300ms between batches → ~3 s total
      (attempt, bestScore) => set({ optimizeProgress: attempt, optimizeBestScore: bestScore }),
    ).then((schedule) => {
      saveSchedule(schedule)
      set({ schedule, optimizing: false, optimizeProgress: ATTEMPTS })
    })
  },

  moveGuest(guestId, fromTableId, toTableId) {
    set((state) => {
      if (!state.schedule) return state
      const tables = state.schedule.tables.map((t) => {
        if (t.id === fromTableId) {
          return { ...t, guestIds: t.guestIds.filter((id) => id !== guestId) }
        }
        if (t.id === toTableId) {
          return { ...t, guestIds: [...t.guestIds, guestId] }
        }
        return t
      })
      const schedule: Schedule = { ...state.schedule, tables }
      saveSchedule(schedule)
      return { schedule }
    })
  },

  setSchedule(s) {
    saveSchedule(s)
    set({ schedule: s })
  },
}))

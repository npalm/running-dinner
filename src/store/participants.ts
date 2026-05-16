import { create } from 'zustand'
import type { Participant } from '../types'
import { loadParticipants, saveParticipants } from '../lib/storage'
import { buildNeighborGraph } from '../lib/coordinates'

interface ParticipantsState {
  participants: Participant[]
  neighborGraph: Map<string, Set<string>>
  add: (p: Omit<Participant, 'id'>) => void
  addMany: (ps: Omit<Participant, 'id'>[]) => void
  update: (id: string, p: Partial<Omit<Participant, 'id'>>) => void
  remove: (id: string) => void
  setAll: (participants: Participant[]) => void
}

function persist(participants: Participant[]): void {
  saveParticipants(participants)
}

export const useParticipantsStore = create<ParticipantsState>((set) => {
  const initial = loadParticipants()
  return {
    participants: initial,
    neighborGraph: buildNeighborGraph(initial),

    add(p) {
      set((state) => {
        const next: Participant = { ...p, id: crypto.randomUUID() }
        const participants = [...state.participants, next]
        persist(participants)
        return { participants, neighborGraph: buildNeighborGraph(participants) }
      })
    },

    addMany(ps) {
      set((state) => {
        const next = ps.map((p) => ({ ...p, id: crypto.randomUUID() }))
        const participants = [...state.participants, ...next]
        persist(participants)
        return { participants, neighborGraph: buildNeighborGraph(participants) }
      })
    },

    update(id, partial) {
      set((state) => {
        const participants = state.participants.map((p) =>
          p.id === id ? { ...p, ...partial } : p,
        )
        persist(participants)
        return { participants, neighborGraph: buildNeighborGraph(participants) }
      })
    },

    remove(id) {
      set((state) => {
        const participants = state.participants.filter((p) => p.id !== id)
        persist(participants)
        return { participants, neighborGraph: buildNeighborGraph(participants) }
      })
    },

    setAll(participants) {
      persist(participants)
      set({ participants, neighborGraph: buildNeighborGraph(participants) })
    },
  }
})

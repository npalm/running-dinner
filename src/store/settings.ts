import { create } from 'zustand'
import type { TableSizeStrategy } from '../types'
import { DEFAULT_STRATEGY } from '../lib/schedule'

const STORAGE_KEY = 'running-dinner-strategy'

function loadStrategy(): TableSizeStrategy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((n: unknown) => typeof n === 'number' && n >= 4 && n <= 8)
      ) {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_STRATEGY
}

function saveStrategy(strategy: TableSizeStrategy): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategy))
}

interface SettingsState {
  strategy: TableSizeStrategy
  setStrategy: (strategy: TableSizeStrategy) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  strategy: loadStrategy(),
  setStrategy(strategy) {
    saveStrategy(strategy)
    set({ strategy })
  },
}))

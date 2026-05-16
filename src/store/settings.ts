import { create } from 'zustand'
import type { TableSizeStrategy } from '../types'
import { DEFAULT_STRATEGY } from '../lib/schedule'

const STORAGE_KEY = 'running-dinner-strategy'
const VARIABLE_TABLES_KEY = 'running-dinner-variable-tables'

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

function loadAllowVariableTables(): boolean {
  try {
    const raw = localStorage.getItem(VARIABLE_TABLES_KEY)
    if (raw !== null) return JSON.parse(raw) === true
  } catch {
    /* ignore */
  }
  return true
}

function saveAllowVariableTables(value: boolean): void {
  localStorage.setItem(VARIABLE_TABLES_KEY, JSON.stringify(value))
}

interface SettingsState {
  strategy: TableSizeStrategy
  allowVariableTables: boolean
  setStrategy: (strategy: TableSizeStrategy) => void
  setAllowVariableTables: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  strategy: loadStrategy(),
  allowVariableTables: loadAllowVariableTables(),
  setStrategy(strategy) {
    saveStrategy(strategy)
    set({ strategy })
  },
  setAllowVariableTables(value) {
    saveAllowVariableTables(value)
    set({ allowVariableTables: value })
  },
}))

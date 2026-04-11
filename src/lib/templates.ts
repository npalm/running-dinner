import type { CardTemplates } from './cards'

const STORAGE_KEY = 'running-dinner-templates'

export function loadTemplates(defaults: CardTemplates): CardTemplates {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveTemplates(templates: CardTemplates): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

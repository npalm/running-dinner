import { create } from 'zustand'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme()
  applyTheme(initial)

  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const next: Theme = e.matches ? 'dark' : 'light'
        applyTheme(next)
        set({ theme: next })
      }
    })
  }

  return {
    theme: initial,
    toggle() {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      applyTheme(next)
      set({ theme: next })
    },
    setTheme(t) {
      localStorage.setItem('theme', t)
      applyTheme(t)
      set({ theme: t })
    },
  }
})

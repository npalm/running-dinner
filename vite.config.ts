import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.tsx',
        'src/App.tsx',
        'src/i18n/',
        'src/types/',
        'src/store/',
        'src/hooks/',
        'src/pages/',
        'src/components/layout/',
        'src/components/map/',
        'src/components/schedule/',
        'src/components/welcome/',
        'src/components/participants/ParticipantForm.tsx',
        'src/components/participants/ParticipantList.tsx',
        'src/components/participants/TestDataForm.tsx',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 92,
        lines: 90,
      },
    },
  },
})


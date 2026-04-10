# Development Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 24 | `nvm install 24` or see [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `npm install -g pnpm` |

```bash
nvm use        # switches to Node 24 via .nvmrc
pnpm install   # installs all dependencies
```

## Local Development

```bash
pnpm dev       # dev server at http://localhost:5173 with HMR
pnpm build     # production build → dist/
pnpm preview   # serve the production build locally
```

## Testing

```bash
pnpm test               # vitest in watch mode
pnpm test:coverage      # single run with v8 coverage report
```

Coverage is enforced at **80%** across statements, branches, functions, and lines. The CI job fails below this threshold.

Test files live next to the code they test:
- `src/lib/*.test.ts` — pure function unit tests (no DOM)
- `src/components/**/*.test.tsx` — React component tests via Testing Library

### Writing Tests

```typescript
// src/lib/example.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './example'

describe('myFunction', () => {
  it('returns expected result', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

For components, use the `renderWithProviders` helper which wraps in router + i18n:

```typescript
import { renderWithProviders } from '../../test/renderWithProviders'
import { MyComponent } from './MyComponent'

it('renders correctly', () => {
  const { getByText } = renderWithProviders(<MyComponent />)
  expect(getByText('Hello')).toBeInTheDocument()
})
```

## Linting & Type Checking

```bash
pnpm lint        # ESLint (errors fail CI)
pnpm typecheck   # tsc --noEmit (no emit, just type errors)
```

ESLint uses the flat config format (`eslint.config.js`). TypeScript strict mode is enabled.

## Git Hooks (Husky)

Hooks are installed automatically on `pnpm install` via the `prepare` script.

| Hook | Runs |
|---|---|
| `pre-commit` | `lint-staged` → ESLint `--fix` on staged `*.ts`/`*.tsx` files |
| `pre-push` | `tsc --noEmit` + `vitest run` |

To bypass temporarily (not recommended): `git push --no-verify`

## Translations

Add or update translations in **both** files:

| File | Language |
|---|---|
| `src/i18n/nl.ts` | Dutch (NL) — source of truth |
| `src/i18n/en.ts` | English (EN) |

The app detects the browser language on first load and defaults to NL when the browser is not set to English.

## Adding a New Page

1. Create `src/pages/MyPage.tsx`
2. Add a `<Route>` in `src/App.tsx`
3. Add a navigation entry in `src/components/layout/Navigation.tsx`
4. Add translation keys in both `src/i18n/nl.ts` and `src/i18n/en.ts`

## Adding a New Store

```typescript
// src/store/myStore.ts
import { create } from 'zustand'

interface MyState {
  value: string
  setValue: (v: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}))
```

Persist to localStorage by calling `localStorage.setItem` inside the action.

## Geocoding (PDOK)

The app uses the Dutch PDOK Locatieserver — no API key needed:

```typescript
import { geocodeAddress } from '../lib/geocoding'

const coords = await geocodeAddress('Guldenstraat 21, Eindhoven')
// → { lat: 51.441, lng: 5.478 } or null
```

Reverse geocoding requires **RD New** coordinates — use `wgs84ToRd()` from `src/lib/coordinates.ts` first (handled automatically by `reverseGeocode`).

## Deployment

The app builds to static files in `dist/`. Deploy anywhere that serves static files:

- **Vercel**: select framework **Vite**, build command `pnpm build`, output `dist`
- **Netlify**: same settings
- **GitHub Pages**: use the `dist/` folder

## CI/CD

GitHub Actions runs on every PR and push to `main`:

| Job | What it checks |
|---|---|
| Lint | `pnpm lint` — zero ESLint errors |
| Type check | `pnpm typecheck` — zero TypeScript errors |
| Test | `pnpm test:coverage` — all tests pass, coverage ≥ 80% |
| Build | `pnpm build` — production build succeeds |

Additional workflows:
- **OSV-Scanner** — dependency vulnerability scan on PRs
- **OSSF Scorecard** — supply-chain security (weekly)
- **zizmor** — GitHub Actions workflow security analysis

## Environment

No environment variables are required. The app is entirely client-side.

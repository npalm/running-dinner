# Architecture

This document describes the high-level architecture of the Running Dinner Planner.

## Overview

The app is a **purely client-side SPA** (Single Page Application). All state lives in the browser — there is no backend, no database, and no authentication. Data is persisted via `localStorage` and can be exported/imported as JSON.

```
Browser
  ├── React 19 + Vite 8 (UI framework + build tool)
  ├── TailwindCSS v4 (styling)
  ├── Zustand (global state)
  ├── react-router-dom (client-side routing)
  ├── i18next (NL/EN internationalisation)
  ├── @dnd-kit (drag & drop)
  ├── Leaflet 1.9 (interactive map)
  └── localStorage (persistence)
        └── PDOK API (Dutch geocoding — called directly from browser)
```

## Directory Structure

```
src/
├── types/          # Shared TypeScript interfaces (Participant, Table, Schedule, …)
├── i18n/           # NL + EN translation files and i18next initialisation
├── lib/            # Pure functions — no React, fully unit-tested
│   ├── coordinates.ts   # Haversine distance, neighbor detection, WGS84→RD conversion
│   ├── geocoding.ts     # PDOK API wrapper (forward + reverse geocoding)
│   ├── schedule.ts      # Schedule generation algorithm (see below)
│   ├── storage.ts       # localStorage CRUD + JSON export/import
│   └── testdata.ts      # Test data generator (28 participants, Eindhoven)
├── store/          # Zustand stores
│   ├── participants.ts  # Participant CRUD + neighbor graph
│   ├── schedule.ts      # Schedule generation, optimisation, async progress
│   └── theme.ts         # Dark/light theme (class-based via Tailwind v4)
├── hooks/
│   └── useTheme.ts      # Re-exports useThemeStore for backwards compat
├── components/
│   ├── layout/          # Header, Navigation, Layout
│   ├── ui/              # Button, Input, Select, Badge, Card, Modal
│   ├── participants/    # ParticipantCard, ParticipantForm, ParticipantList, TestDataForm
│   ├── schedule/        # ScheduleBoard, CourseColumn, HostCard, GuestCard,
│   │                    # MeetingsView, GeneratingAnimation
│   ├── map/             # DinnerMap (raw Leaflet — no react-leaflet)
│   └── welcome/         # WelcomeScreen (first-time onboarding)
├── pages/          # ParticipantsPage, SchedulePage, MapPage
├── test/           # Vitest setup + renderWithProviders helper
├── App.tsx         # Route definitions + WelcomeScreen gate
└── main.tsx        # React root mount
```

## Data Model

```typescript
type CookingPreference = 'starter' | 'main' | 'dessert' | 'prefer-not' | null
type Course = 'starter' | 'main' | 'dessert'

interface Participant {
  id: string          // crypto.randomUUID()
  name: string
  count: 1 | 2        // persons in household
  address: string     // raw address string entered by user
  coordinates: { lat: number; lng: number } | null  // from PDOK geocoding
  preference: CookingPreference
}

interface Table {
  id: string
  course: Course
  hostId: string      // participant who cooks — their address is fixed
  guestIds: string[]  // participants visiting this table
}

interface Schedule {
  tables: Table[]
  generatedAt: string // ISO timestamp
}
```

## Schedule Generation Algorithm

The algorithm is in `src/lib/schedule.ts`. It runs synchronously and is pure (no side effects).

### Steps

1. **Select hosts** — for each course, score every participant group by preference fit. Groups with a matching preference score highest; `prefer-not` groups score lowest. Neighbours (< 150 m apart) are excluded from hosting the same course. Selection uses a greedy + random-jitter approach to avoid deterministic outcomes.

2. **Build tables** — each host initialises a table with their own household.

3. **Assign guests** — remaining groups are assigned one table per course using a weighted scoring function:
   - `REPEAT_PENALTY = 50` per person already met in a previous course
   - `NEIGHBOR_PENALTY = 200` for geographic neighbours
   - A small random jitter prevents identical schedules across runs
   - Cross-course meeting awareness via `buildMetGraph()` — tracks who has already sat together

4. **Validate** — `validateSchedule()` checks every participant appears exactly once per course and table sizes are within 4–8.

### Table Size Target

The algorithm targets **6 persons per table** (acceptable range 4–8). For *N* total persons:

```
tables_per_course = round(N / 6)
```

When 6 doesn't divide evenly, sizes of 5 are preferred over 7+. A size of 8 is a last resort.

### Optimisation

`optimizeSchedule(participants, attempts = 30)` runs the generator 30 times and returns the schedule with the fewest *duplicate meeting pairs* (people who share a table more than once). The scoring formula is:

```
score = sum(count - 1) for each pair meeting more than once
```

Lower is better; 0 means everyone meets new people at every course.

## State Management

All global state uses **Zustand** stores:

| Store | Responsibility |
|---|---|
| `participants` | Participant list, neighbor graph, CRUD, localStorage persistence |
| `schedule` | Current schedule, generating/optimising state, async progress |
| `theme` | Current theme (`light`\|`dark`), toggle, localStorage persistence |

Stores call `localStorage` directly on every mutation — no debounce needed for this data size.

## Geocoding

The app uses the **PDOK Locatieserver** (Dutch government geocoding API) — free, no API key required, NL-only coverage.

- **Forward geocoding** (`geocodeAddress`): `q=<address>&rows=1` → returns `centroide_ll` as `POINT(lon lat)`
- **Reverse geocoding** (`reverseGeocode`): requires **RD New (EPSG:28992)** coordinates. WGS84 → RD conversion is done via the RDNAPTRANS polynomial approximation (`wgs84ToRd` in `coordinates.ts`), accurate to ~1 m within the Netherlands.

## Internationalisation

- Default language: **NL** (detected from `navigator.language`, falls back to `'nl'`)
- Supported: `nl`, `en`
- Translation keys are in `src/i18n/nl.ts` (source of truth) and `src/i18n/en.ts`
- Language is switched at runtime via `i18n.changeLanguage()` — no page reload needed

## Theme

- Managed by the `useThemeStore` Zustand store
- Persisted in `localStorage` under key `'theme'`
- On load: reads localStorage → falls back to `prefers-color-scheme` media query
- Applied by toggling the `dark` class on `<html>` — enabled via `@custom-variant dark` in `index.css` (Tailwind v4 requires explicit configuration for class-based dark mode)

## Security Considerations

- No server, no credentials, no user data leaves the browser (except geocoding queries to PDOK)
- No `eval`, no `dangerouslySetInnerHTML`
- Address input is passed as URL query parameters to PDOK — no sanitisation needed beyond URL encoding (handled by `fetch`)
- Dependencies audited weekly by Dependabot + OSV-Scanner GitHub Actions workflow
- GitHub Actions workflows are pinned to commit SHAs and analysed by zizmor (pedantic mode)

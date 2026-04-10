# 🍽️ Running Dinner Planner

A web app for planning a running dinner — participants are automatically assigned to host different courses at different homes, so everyone meets new people along the way.

Built with TypeScript, React 19, Vite 8, and TailwindCSS v4. NL/EN bilingual, dark/light mode.

**[→ Live demo](https://running-dinner.vercel.app)** &nbsp;|&nbsp; **[Architecture](docs/ARCHITECTURE.md)** &nbsp;|&nbsp; **[Development guide](docs/DEVELOPMENT.md)**

---

## Features

- 👥 **Participant management** — add households with name, address, number of persons and cooking preference
- 🗺️ **Address geocoding** — Dutch addresses resolved via [PDOK](https://api.pdok.nl) (no API key needed)
- 📋 **Automatic schedule** — algorithm assigns who cooks what and who visits where, targeting 6 persons per table
- 🎯 **Optimisation** — 30-attempt random-restart search minimises repeat meetings between participants
- 👀 **Meetings visualisation** — network graph, matrix heatmap, journey timeline, and meeting list
- 🗺️ **Interactive map** — Leaflet map showing all addresses and host locations
- 🔀 **Drag & drop** — manually adjust the schedule by dragging guest cards between tables
- 🌍 **NL/EN** — Dutch by default, English available via toggle
- 🌙 **Dark/light mode** — follows system preference, manually overridable
- 💾 **Offline-first** — all data in `localStorage`, exportable as JSON
- 🧪 **Test data generator** — generates 28 realistic participants in Eindhoven in seconds

## Quick Start

```bash
# Prerequisites: Node 24, pnpm 10+
nvm use
pnpm install
pnpm dev      # → http://localhost:5173
```

## How It Works

A **running dinner** (lopend diner) is a social event where participants move between homes for each course:

1. Each household **hosts one course** (starter, main, or dessert) and cooks for their guests
2. For the other two courses, they **visit other homes** as guests
3. The goal is to **meet as many new people as possible** — the algorithm minimises repeat encounters

### Workflow

```
Add participants → Generate schedule → Optimise → View on map
      👥                  📋               🎯            🗺️
```

1. **Add participants** — enter name, address, count and optional preference, or generate test data
2. **Generate** — the app creates a valid schedule automatically
3. **Adjust** — drag guest cards to swap assignments, or regenerate
4. **Optimise** — run 30 attempts to find the schedule with fewest repeat meetings
5. **Explore** — view the network graph, matrix, or map to see who meets whom

## Stack

| Concern | Package |
|---|---|
| UI | React 19 + Vite 8 |
| Styling | TailwindCSS v4 |
| State | Zustand 5 |
| Routing | react-router-dom 7 |
| i18n | i18next + react-i18next |
| Map | Leaflet 1.9 (direct, no wrapper) |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Testing | Vitest 4 + Testing Library |
| Geocoding | PDOK Locatieserver (free, NL-only) |

## Project Structure

```
src/
├── lib/          # Pure functions — schedule algorithm, geocoding, coordinates, storage
├── store/        # Zustand stores (participants, schedule, theme)
├── components/   # UI components (layout, participants, schedule, map, welcome)
├── pages/        # ParticipantsPage, SchedulePage, MapPage
├── i18n/         # NL + EN translations
└── types/        # Shared TypeScript interfaces
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a detailed breakdown.

## Development

```bash
pnpm test            # vitest watch
pnpm test:coverage   # coverage report (≥80% enforced)
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm build           # production build → dist/
```

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the full development guide.

## CI/CD

All PRs run: **lint → typecheck → test + coverage → build**

Additional security workflows: OSV-Scanner, OSSF Scorecard, zizmor (workflow security).

## Deployment

Static SPA — deploy `dist/` anywhere. On Vercel: select framework **Vite**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Niek Palm

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

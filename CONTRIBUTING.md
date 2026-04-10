# Contributing to Running Dinner Planner

Thank you for your interest in contributing! This document explains how to get started.

## Code of Conduct

Be respectful and constructive. This project follows the [Contributor Covenant](https://www.contributor-covenant.org/).

## Getting Started

### Prerequisites

- **Node.js** 24 (see `.nvmrc`)
- **pnpm** 10+

```bash
nvm use          # or: node --version should match .nvmrc
pnpm install
pnpm dev         # starts dev server at http://localhost:5173
```

### Running Tests

```bash
pnpm test              # watch mode
pnpm test:coverage     # single run with coverage report (enforces 80% threshold)
pnpm typecheck         # TypeScript type check
pnpm lint              # ESLint
```

## Workflow

1. **Fork** the repository and create a branch from `main`
2. Branch naming: `feat/`, `fix/`, `docs/`, `chore/` prefix
3. Make your changes — keep commits small and focused
4. Ensure all checks pass locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
   ```
5. Push and open a **Pull Request** against `main`
6. The pre-push hook runs typecheck + tests automatically

## Pull Request Guidelines

- Write a clear description of what changed and why
- Reference any related issues with `Fixes #123`
- All CI checks must pass before merge (lint, typecheck, test, build)
- Coverage must stay at or above 80% — add tests for new logic

## Code Style

- **TypeScript** strict mode — no `any`, no `@ts-ignore`
- **Small, focused functions** — each function does one thing
- **No code duplication** — extract shared logic to `src/lib/`
- **Comments only where needed** — code should be self-documatory
- ESLint enforces the rest — run `pnpm lint --fix` to auto-fix

## Adding Translations

The app is bilingual (NL default, EN). When adding new UI text:

1. Add the key to `src/i18n/nl.ts` first (NL is the source of truth)
2. Add the English equivalent to `src/i18n/en.ts`
3. Use the key via `const { t } = useTranslation()` → `t('section.key')`

## Project Structure

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a full overview.

## Reporting Issues

Open a GitHub issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behaviour
- Browser and OS if relevant

## Security

Do not open public issues for security vulnerabilities. Email the maintainer directly instead.

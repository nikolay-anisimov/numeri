# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` workspaces.
- Apps: `apps/web` (Next.js UI), `apps/api` (NestJS API), `services/ocr` (Express OCR service).
- Packages: `packages/utils` (TS utilities, CJS), `packages/ui` (React UI kit), `packages/config` (shared ESLint/Prettier/TS configs).
- Supporting: `docs/`, `scripts/`, `docker/`, `docker-compose.yml`. Env files: `.env`, `.env.example`.

## Build, Test, and Development Commands
- Root dev: `pnpm dev` — run Web, API, OCR together (watch).
- Build all: `pnpm build` — compile every workspace in parallel.
- Lint/Format: `pnpm lint`, `pnpm format` — shared config via `@packages/config`.
- Types: `pnpm typecheck` — TS noEmit across workspaces.
- Tests: `pnpm test` — run workspace tests. E2E: `pnpm e2e` (web Playwright).
- Per-package example: `pnpm --filter @apps/api test`, `pnpm --filter @packages/utils build`.
- Docker: `docker-compose up -d` — spins up Postgres and services (uses `.env`).

## Coding Style & Naming Conventions
- Indentation: 2 spaces (`.editorconfig`). LF line endings; trim trailing whitespace.
- Linting: ESLint 9 flat config from `packages/config/eslint/flat.cjs`; format with Prettier (`packages/config/prettier.cjs`).
- TypeScript: 5.x; prefer explicit types at module boundaries.
- Naming: files `kebab-case.ts`; React components `PascalCase.tsx` (e.g., `Button.tsx`); barrels as `index.ts`.
- Imports: use workspace aliases (`@apps/*`, `@packages/*`) where available.

## Testing Guidelines
- API: Jest (`apps/api`), run `pnpm --filter @apps/api test`.
- Web/Utils: Vitest (`apps/web`, `packages/utils`). E2E via Playwright in `apps/web/tests/e2e`.
- Add tests beside code (`src/*.spec.ts|test.ts`) or under `tests/` as configured. Aim for meaningful coverage on new code.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits with optional scope, e.g. `fix(utils): round2 handles 1.005`, `ci: cache pnpm`, `docs: add API notes`.
- PRs: clear description, link issues, list changes; include screenshots for UI; note breaking changes; update docs and `.env.example` when config changes.
- CI basics: ensure `pnpm build`, `pnpm lint`, `pnpm typecheck`, and tests pass locally before requesting review.

## Security & Configuration
- Copy `.env.example` to `.env`. `apps/api` loads env at startup; `DATABASE_URL` required for Prisma; `NEXT_PUBLIC_API_URL` used by Web.
- Never commit secrets. Prefer `docker-compose` for local DB (Postgres 16).

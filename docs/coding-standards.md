# Coding Standards

## Naming

- **Files/dirs:** kebab-case (`listing-service.ts`, `create-listing-form.tsx`).
- **Components:** PascalCase (`ListingCard.tsx`); hooks `useXxx.ts`.
- **Functions/variables:** camelCase.
- **Types/interfaces:** PascalCase; type aliases preferred over interfaces where structural.
- **API fields:** camelCase JSON (see `docs/openapi.yaml`).
- **Database:** snake_case tables/columns; enum values UPPER_SNAKE in DB, lowercase strings in API (mapped at the repository boundary).

## Type & schema conventions

- TypeScript `strict` mode; no `any` (use `unknown` + narrowing); explicit return types on public service functions.
- All request/response shapes defined once in `shared/` (Zod); DB ↔ API mapping in the repository layer.
- Enums are centralized in `shared/` and Prisma, never duplicated.

## Error handling

- Throw typed domain errors; map to the error envelope in a single central handler (see `docs/06-api-contract.md` §Error envelope).
- Never swallow errors silently; always log with context and a correlation id.
- No leaking of internals/stack traces to clients.

## Logging

- Structured JSON logs; levels `debug|info|warn|error`.
- Never log passwords, session tokens, secrets, or full message bodies.
- Include request/actor correlation ids for traceability.

## Formatting / linting / type checking

- Prettier (formatting), ESLint (lint), `tsc --noEmit` (typecheck). All run in CI as a required gate.
- Committed, shared config files at repo root.

## Dependencies

- Pin stable, supported versions; lockfile committed.
- Add a dependency only when it satisfies a real requirement; run `npm audit` in CI.

## Environment configuration

- All config via env vars; `.env` is gitignored; `.env.example` holds placeholder keys only (see root `.env.example`).

## Git branch & commit conventions

- `main` is always deployable.
- Feature branches: `feat/<short-slug>`, `fix/<short-slug>`, `docs/<slug>`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- No commits to `main` directly for feature work; changes land via PR with review.

## Code review expectations

- Focused diffs; no unrelated refactors.
- Contract-impacting changes (`shared/`, `docs/openapi.yaml`, `prisma/schema.prisma`) require explicit PM/architect approval.
- Tests added/updated with code; CI green before merge.

## Test placement

- Unit/component tests co-located (`*.test.ts`/`*.test.tsx`).
- Integration/API tests in `tests/integration/`.
- E2E + a11y in `tests/e2e/` (Playwright).

## Documentation requirements

- Every requirement is traceable (see `docs/traceability-matrix.md`).
- Decision-worthy changes get a `docs/decision-log.md` entry.
- README and `AGENTS.md` kept current with the workflow.

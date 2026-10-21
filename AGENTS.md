# AGENTS.md

Guidance for AI coding agents working in this repository. Read this and the relevant `docs/*` files **before** making changes.

## What this project is

An Amazon-inspired **student marketplace** web app (TypeScript / Next.js modular monolith + PostgreSQL + Prisma). It is currently in **blueprint/planning** phase — no application code exists yet. Do not begin implementation until the project owner approves the blueprint (see `docs/implementation-roadmap.md` Phase 0).

## Source of truth (read first)

- `docs/01-product.md` — product scope, journeys, boundaries.
- `docs/02-requirements.md` — stable `FR-*`/`NFR-*` requirements + acceptance criteria.
- `docs/03-domain-model.md` — entities, lifecycle, constraints.
- `docs/04-architecture.md` — architecture + data flows.
- `docs/05-tech-stack.md` — selected stack.
- `docs/06-api-contract.md` + `docs/openapi.yaml` — **authoritative API contract**.
- `docs/08-security.md` — security model.
- `docs/10-testing-strategy.md` — test pyramid + release gate.
- `docs/12-agent-contracts.md` — role ownership.
- `docs/open-questions.md` — unresolved decisions (do not silently resolve).
- `docs/decision-log.md` — decisions + rationale.

## Operating rules

1. **Do not invent requirements.** Implement only what the docs specify. Proposals for new behavior need a decision-log entry and owner approval.
2. **Never change the API contract or shared schemas unilaterally.** `shared/`, `docs/openapi.yaml`, and `prisma/schema.prisma` are high-contention files; changes require PM/architect approval (see `docs/12-agent-contracts.md` §12.7).
3. **Enforce authorization server-side.** Never rely on client checks.
4. **Keep changes focused.** No unrelated refactors.
5. **Add/update tests with code.** Report test commands and **actual** outcomes; never claim unexecuted tests passed.
6. **Never commit secrets or user data.** Use env vars (see `.env.example`).
7. **Follow naming and formatting** in `docs/coding-standards.md`.

## Agent roles

- **Project Manager:** scope, requirements, traceability, approval.
- **Architect/PM-lead:** architecture, DB, contracts, security.
- **Backend:** models/migrations, API, validation, authZ, tests.
- **Frontend:** UI, components, forms, API client, states, a11y, tests.
- **Tester:** independent verification, regression, defects. Must not modify production code.

## Definition of done (any task)

- Requirements traceable and satisfied.
- Tests run and passing (with evidence).
- Changed files reported.
- No contract/secret violations.
- No unrelated changes.

## Getting started

See `README.md` and `.env.example`. There is no implementation yet; once Phase 1 begins, follow `docs/repository-structure.md`.

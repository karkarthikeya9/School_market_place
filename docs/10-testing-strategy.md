# 10 — Testing Strategy

## Test pyramid

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure functions, validators, price conversion, lifecycle guard |
| Database integration | Vitest + test Postgres | Prisma models, constraints, transactions, FTS queries |
| API contract | Vitest + supertest/fetch + OpenAPI validation | Endpoint status codes, schemas, auth |
| Authorization/security | Vitest (integration) | Ownership, IDOR, roles, rate limits |
| Frontend component | Vitest + React Testing Library | Components, forms, states |
| End-to-end | Playwright | Full user journeys |
| Responsive | Playwright viewports | 320/768/1440 |
| Accessibility | Playwright + axe-core | WCAG 2.2 AA (no critical/serious) |
| Performance | k6 (staging, proportionate) | p95 thresholds (NFR-PERF-*) |
| Deployment smoke | Playwright/curl script | Health checks, login, create listing on deployed env |

## Responsibilities

- **Unit:** lowest volume of failures; isolate business logic.
- **Integration (DB):** run against a disposable Postgres (testcontainers or CI service), migrated + seeded per run.
- **Contract:** each endpoint asserted against `docs/openapi.yaml` (status, required fields, error envelope). A schema-drift check fails CI if the implementation and OpenAPI diverge.
- **Security:** explicit negative tests (non-owner edit → 403, third-party conversation read → 403, invalid image → 422, suspended login → 403).
- **Component:** render states (loading/empty/error) and form validation.
- **E2E:** happy paths + the acceptance scenarios below; run in CI against a preview environment with isolated seed data.
- **A11y:** axe-core assertions on key screens; keyboard-only journey.

## Core acceptance scenarios (from the brief)

1. **Authentication:** unauthenticated access to a protected feature redirects/returns `401`.
2. **Listing creation:** authenticated verified seller submits a valid listing → saved and visible per publication rules.
3. **Listing ownership:** Student B editing Student A's listing → `403`.
4. **Search:** listings with varied title/category/price/condition; combined filters return only matching active listings.
5. **Sold item:** mark-sold → listing no longer appears in search/browse; direct public access → 404.
6. **Wishlist:** save → appears and persists across sessions; re-save idempotent.
7. **Messaging:** participant sends → other participant retrieves.
8. **Messaging privacy:** non-participant → `403`.
9. **Image validation:** invalid/oversized upload rejected without corrupting listing or leaving public orphans.
10. **Persistence:** created listing survives restart.
11. **Administrative controls:** admin deactivates a prohibited listing → persisted + audited.
12. **Deployment:** clean env with documented secrets/DB → deploy succeeds, health checks pass.

## Test quality rules

- Deterministic where practical; isolated fixtures (no shared mutable test data).
- No dependence on production accounts.
- Never claim unexecuted tests passed; report skipped tests and reasons.
- Regression test required for every bug fix.
- The **tester agent must not modify production implementation code** — only test code/fixtures/docs; fixes are assigned to the owner agent.
- Coverage targets are meaningful only if enforced: require coverage on core modules (auth, listings service, chat service) at a meaningful bar (e.g., ≥80% statements) — **proposed, to be confirmed**; not a substitute for the acceptance scenarios.

## Minimum release gate

1. Lint + typecheck pass (0 errors).
2. Unit + integration + contract + security suites pass.
3. E2E acceptance scenarios (1–12) pass on a clean preview environment.
4. axe-core reports no critical/serious issues on core screens.
5. `npm audit`/dependency scan shows no high/critical vulnerabilities.
6. OpenAPI contract drift check passes.

# Implementation Roadmap

Planned in dependency order. No precise dates are given (team size, time, and infrastructure are unknown). Each phase is gated by its prerequisites and Definition of Done.

## Phase 0 — Requirements & architecture approval
- **Scope:** finalize open questions (OQ-1…OQ-10), approve this blueprint.
- **Prerequisites:** none.
- **Deliverables:** approved `docs/*`, resolved decision log.
- **Responsible:** PM / owner.
- **Definition of done:** owner approves blueprint; unresolved decisions that block Phase 1+ are answered.
- **Risks:** unresolved OQ-3/OQ-1 rework.

## Phase 1 — Repo setup, environment, database foundation, authentication
- **Scope:** scaffold Next.js + TS + Tailwind + Prisma; CI (lint/typecheck/test); Docker Postgres; `users`, `user_profiles`, `universities`, `categories` models + migrations + seed; registration/login/logout/`me`; session + roles; error envelope + logging + health.
- **Prerequisites:** Phase 0.
- **Deliverables:** runnable app, auth flows, `GET /health`, `GET /categories`, `GET /universities`.
- **Files:** `prisma/schema.prisma`, `backend/modules/auth/**`, `backend/lib/**`, `shared/**`, `frontend/app/auth/**`.
- **Responsible:** Backend + Frontend (Tester verifies).
- **Tests:** auth contract/security/unit; E2E register+login.
- **Definition of done:** CI green; acceptance scenarios 1 and 10 (auth/persistence) pass.

## Phase 2 — Listing lifecycle, images, management
- **Scope:** Listing CRUD + status transitions; image upload (signature validation, object storage); `GET/POST/PATCH/DELETE /listings/*`, `me/listings`, images endpoints; create/edit/my-listings UI.
- **Prerequisites:** Phase 1.
- **Deliverables:** full listing lifecycle + images.
- **Responsible:** Backend + Frontend.
- **Tests:** listing creation/ownership/sold/image tests; acceptance 2, 3, 5, 9.
- **Definition of done:** sold invariant holds; image validation safe.

## Phase 3 — Search, category browse, filters, sort, pagination
- **Scope:** FTS + trigram search; filters; sort; pagination; home + search results UI.
- **Prerequisites:** Phase 2.
- **Deliverables:** searchable/browsable catalog.
- **Responsible:** Backend + Frontend.
- **Tests:** search/filter/sort/pagination; acceptance 4.
- **Definition of done:** combined filters return exactly matching active listings.

## Phase 4 — Seller profiles
- **Scope:** `GET /sellers/{id}` + `GET /sellers/{id}/listings`; public profile UI; listing→seller link.
- **Prerequisites:** Phase 2.
- **Responsible:** Backend + Frontend.
- **Tests:** contract (privacy — no private fields), integration.

## Phase 5 — Conversations & messaging
- **Scope:** conversation + message endpoints; participant authorization; polling; conversations list + detail UI.
- **Prerequisites:** Phase 2.
- **Responsible:** Backend + Frontend.
- **Tests:** messaging, privacy, validation; acceptance 7, 8.
- **Definition of done:** non-participant access denied; history persists.

## Phase 6 — Wishlist
- **Scope:** wishlist endpoints; unique constraint; unavailable-item display; wishlist UI.
- **Prerequisites:** Phase 2.
- **Responsible:** Backend + Frontend.
- **Tests:** wishlist, idempotency, persistence; acceptance 6.

## Phase 7 — Moderation, security hardening, audit logging
- **Scope:** reports, admin moderation endpoints, suspension, audit log; security headers, rate limiting, CORS; admin UI.
- **Prerequisites:** Phases 2–6 (targets listings/users).
- **Responsible:** Backend + Frontend.
- **Tests:** admin controls, audit; acceptance 11; security suite.
- **Definition of done:** moderation actions persisted + audited; hardened headers in place.

## Phase 8 — Integration testing, accessibility, regression
- **Scope:** full E2E suite, responsive matrix, axe-core, performance smoke, regression.
- **Prerequisites:** Phase 7.
- **Responsible:** Tester (fixes assigned to owners).
- **Tests:** all acceptance scenarios (1–12) + a11y + responsive.
- **Definition of done:** release gate green (see `docs/10-testing-strategy.md`).

## Phase 9 — Production deployment, smoke tests, documentation
- **Scope:** provision production Postgres/storage; env config; migrations; seed admin; deploy; domain/HTTPS; backups; smoke tests; finalize README/runbooks.
- **Prerequisites:** Phase 8.
- **Responsible:** PM + Backend.
- **Tests:** deployment smoke; acceptance 12.
- **Definition of done:** live site, health checks pass, backup/restore documented and drilled.

## Dependency summary

```
Phase 0 → 1 → 2 → 3 (search depends on listings)
                 → 4 (profiles)
                 → 5 (chat depends on listings)
                 → 6 (wishlist depends on listings)
     → 7 (moderation depends on listings/users)
     → 8 (integration over all)
     → 9 (deploy)
```

Phases 3–6 are largely independent once Phase 2 is complete and may run in parallel by different agents, coordinated by the PM.

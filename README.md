# Student Marketplace

An **Amazon-inspired student marketplace** web application. Students discover, list, and communicate about second-hand goods (textbooks, electronics, furniture, and other permitted items).

> **Status: blueprint/planning.** This repository contains the complete engineering blueprint and no application code yet. Implementation begins only after the project owner approves the blueprint (see `docs/implementation-roadmap.md` Phase 0).

## What it does (MVP)

- **Discover:** search, browse, filter (category, price, condition), sort, and paginate active listings.
- **Sell:** create a listing (draft), upload ordered images, publish, edit, deactivate, and mark sold.
- **Profiles:** public seller profiles that never expose private data.
- **Chat:** private buyer–seller messaging about a listing.
- **Wishlist:** save items across sessions, with clear "Unavailable" handling for sold/removed items.
- **Moderation:** admins review reports, moderate listings, and suspend users with an audit trail.

Explicitly **out of scope** (MVP non-goals): payments, cart/checkout, escrow, shipping, reviews/ratings, recommendations, AI, real-time messaging, native apps.

## Stack (selected after requirements & architecture)

TypeScript · Next.js (App Router) + React · PostgreSQL + Prisma · S3-compatible object storage · Auth.js (credentials + Argon2id) · Zod (shared validation) · Vitest/Playwright · GitHub Actions + Vercel.

Full rationale: `docs/05-tech-stack.md`.

## Documentation (source of truth)

| Doc | Purpose |
|---|---|
| `docs/01-product.md` | Product scope, journeys, boundaries |
| `docs/02-requirements.md` | `FR-*`/`NFR-*` requirements + acceptance criteria |
| `docs/03-domain-model.md` | Entities, lifecycle, constraints, ER diagram |
| `docs/04-architecture.md` | Architecture + sequence diagrams |
| `docs/05-tech-stack.md` | Selected stack + rationale |
| `docs/06-api-contract.md` | API semantics |
| `docs/openapi.yaml` | **Authoritative API contract** (OpenAPI 3.0) |
| `docs/07-ui-ux.md` | Screens, states, design system, accessibility |
| `docs/08-security.md` | Security model |
| `docs/09-ai-architecture.md` | AI evaluation (none in MVP) |
| `docs/10-testing-strategy.md` | Test pyramid + release gate |
| `docs/11-deployment.md` | Deployment architecture |
| `docs/12-agent-contracts.md` | Agent roles & file ownership |
| `docs/failure-handling.md` | Failure/retry/idempotency behavior |
| `docs/repository-structure.md` | Repo layout |
| `docs/coding-standards.md` | Naming, lint, git conventions |
| `docs/traceability-matrix.md` | Requirement → model/API/UI/test traceability |
| `docs/decision-log.md` | Decisions + rationale |
| `docs/open-questions.md` | Unresolved decisions (needs owner) |
| `docs/amazon-reference.md` | Amazon research evidence + adaptations |
| `docs/implementation-roadmap.md` | Phased plan |

## How to work with this repository

1. Read `AGENTS.md` first.
2. The API contract, shared schemas, and Prisma schema are high-contention files — changes require PM/architect approval.
3. Before implementation: resolve the open questions in `docs/open-questions.md`, then follow `docs/implementation-roadmap.md`.

## Getting started (once Phase 1 begins)

1. `cp .env.example .env` and fill in placeholders.
2. Install dependencies and run `prisma migrate dev` + `prisma db seed`.
3. Run the dev server; seed the first admin with `scripts/seed-admin.mjs`.

(Concrete run commands will be added when Phase 1 scaffold exists.)

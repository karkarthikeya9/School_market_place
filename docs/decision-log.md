# Decision Log

Records architecture and product decisions with rationale, trade-offs, and evidence. Status values: `Approved`, `Provisional` (awaiting owner confirmation — see `docs/open-questions.md`), `Rejected`.

| ID | Date | Status |
|---|---|---|

## DEC-001 — Architecture: modular monolith (Next.js full-stack)

- **Context:** The MVP has ~10 bounded features (auth, listings, search, wishlist, chat, moderation) but no independent scaling or team-isolation requirement.
- **Options considered:** (a) modular monolith (single deployable, logical modules), (b) traditional monolith, (c) microservices.
- **Selected:** Modular monolith — one Next.js app with App Router route handlers as the API, organized into feature modules, sharing a single Postgres database.
- **Rationale:** Simplest architecture that satisfies requirements; a single codebase eliminates cross-service contract drift; single deployment simplifies operations; logical modules preserve boundaries for future extraction.
- **Trade-offs:** No independent per-feature scaling or deploy isolation; all features share one process. Acceptable at MVP scale.
- **Consequences:** One repository, one deploy target; API contract discipline enforced by shared TypeScript/Zod schemas rather than network boundaries.
- **Evidence:** Requirements list no scaling/team-isolation constraints; prompt mandates "prefer a modular monolith".
- **Status:** Provisional (depends on OQ-6 team size). Date: 2026-10-21.

## DEC-002 — Language: TypeScript end-to-end

- **Context:** Frontend and backend both need to be built; shared types reduce contract drift between independent agents.
- **Options considered:** TypeScript, Python (FastAPI backend + JS frontend).
- **Selected:** TypeScript throughout (Next.js + React frontend, route-handler backend).
- **Rationale:** One language across frontend/backend means a single shared type/schema source (Zod) can drive both runtime validation and the OpenAPI contract, directly reducing the "conflicting schemas" risk the project must avoid.
- **Trade-offs:** Python would also work and the local project folder is under a `Python` directory; however the prompt does not state a Python preference, and a single-language stack is lower-risk for contract consistency. (Flagged in OQ/tech-stack.)
- **Consequences:** Shared `packages/` or `shared/` type/schema module; TypeScript tooling and CI.
- **Status:** Provisional. Date: 2026-10-21.

## DEC-003 — Database: PostgreSQL

- **Context:** Relational integrity (ownership, constraints, unique wishlist/conversation entries), transactions, and full-text search are core needs.
- **Options considered:** PostgreSQL, SQLite, MySQL, document store.
- **Selected:** PostgreSQL.
- **Rationale:** ACID transactions for listing-state transitions and message persistence; `tsvector` full-text search sufficient for MVP search; mature managed free tiers.
- **Trade-offs:** Heavier than SQLite but required for concurrent writes and production fidelity.
- **Consequences:** Prisma migrations; managed Postgres in production.
- **Status:** Approved. Date: 2026-10-21.

## DEC-004 — ORM: Prisma

- **Context:** Need typed, migration-managed DB access.
- **Options considered:** Prisma, Drizzle, raw SQL.
- **Selected:** Prisma.
- **Rationale:** Strong typing, declarative schema, mature migration tooling, first-class PostgreSQL support.
- **Trade-offs:** Slightly heavier runtime; fine for MVP throughput.
- **Status:** Approved. Date: 2026-10-21.

## DEC-005 — Search: PostgreSQL full-text + trigram

- **Context:** MVP needs keyword search over title/description with filters/sort.
- **Options considered:** PostgreSQL FTS (+ `pg_trgm`), Meilisearch, Elasticsearch/OpenSearch.
- **Selected:** PostgreSQL FTS + `pg_trgm` for partial-match, `ts_rank` for relevance.
- **Rationale:** Meets requirements with zero extra infrastructure; dedicated engines are future scope.
- **Status:** Approved. Date: 2026-10-21.

## DEC-006 — Messaging delivery: database-backed polling

- **Context:** Chat is required; real-time delivery, typing, read receipts are non-requirements.
- **Options considered:** Polling, SSE, WebSockets.
- **Selected:** Polling (fetch messages on load + periodic refresh with a `cursor`).
- **Rationale:** No WebSocket/broker/worker infrastructure needed; stateless and simple.
- **Status:** Provisional (OQ-4). Date: 2026-10-21.

## DEC-007 — No AI in MVP

- **Context:** No requirement needs AI (no recommendations, AI search, chatbots, AI moderation, image categorization).
- **Selected:** No AI integration. Documented as future scope in `docs/09-ai-architecture.md`.
- **Status:** Approved. Date: 2026-10-21.

## DEC-008 — Item conditions: 5-condition enum

- **Context:** Amazon uses 8+ conditions with per-category variants; MVP targets used student goods.
- **Selected:** `new`, `like_new`, `very_good`, `good`, `acceptable`.
- **Rationale:** Unambiguous, honest-condition set; omits Amazon's specialized programs (Renewed/Rental/Collectible) that imply grading infrastructure.
- **Status:** Approved (set flagged for confirmation). Date: 2026-10-21.

## DEC-009 — Listing lifecycle statuses

- **Context:** Need clear availability semantics; "must not represent an item as available after sold".
- **Selected:** `draft | active | sold | inactive | removed` with a defined transition table (see `docs/03-domain-model.md` §Lifecycle).
- **Rationale:** Separates temporary deactivation (`inactive`) from terminal `sold`/`removed`; supports moderation deactivation.
- **Status:** Approved. Date: 2026-10-21.

## DEC-010 — Conversation model: 2 fixed participants

- **Context:** Chat is buyer↔seller anchored to a listing.
- **Options considered:** Conversation + participant join table vs fixed `buyer_id`/`seller_id` columns.
- **Selected:** Fixed `buyer_id` + `seller_id` + `listing_id` with unique `(listing_id, buyer_id)`.
- **Rationale:** Enforces exactly-two-participants and one-conversation-per-buyer-per-listing at the DB level; simpler authorization.
- **Status:** Approved. Date: 2026-10-21.

## DEC-011 — Wishlist: single private list, unique per user+listing

- **Context:** Need save/view/remove with no duplicates, persisted across sessions.
- **Selected:** `wishlist_items` with unique `(user_id, listing_id)`; one implicit list per user.
- **Status:** Approved. Date: 2026-10-21.

## DEC-012 — Currency: INR, integer minor units

- **Context:** Initial market is India (assumption).
- **Selected:** Store prices as integer paise (`price_minor`); expose rupees in API.
- **Rationale:** Avoids floating-point rounding; single currency keeps the model simple.
- **Status:** Approved (currency flagged). Date: 2026-10-21.

## DEC-013 — Authentication: email+password, session cookie, Argon2id

- **Context:** Need secure, simple auth with student/admin roles.
- **Selected:** Auth.js v5 (Credentials provider) or equivalent, Argon2id hashing, httpOnly secure session cookie, `student`/`admin` roles on the user record.
- **Status:** Approved. Date: 2026-10-21.

## DEC-014 — Image storage: object storage

- **Context:** Uploaded images must not live on the app server.
- **Selected:** Object storage (S3-compatible; Vercel Blob in dev/preview) with server-signed upload or server-proxied upload; DB stores storage key + URL + position.
- **Status:** Approved. Date: 2026-10-21.

## DEC-015 — API style: REST `/api/v1`, Zod validation, OpenAPI 3.1

- **Context:** Frontend/backend agents must share an exact contract.
- **Selected:** REST under `/api/v1`, request/response validated with Zod, documented in `docs/openapi.yaml` (OpenAPI 3.0).
- **Status:** Approved. Date: 2026-10-21.

## DEC-016 — Error envelope

- **Context:** Consistent, machine-readable errors.
- **Selected:** `{ "error": { "code", "message", "details?" } }` with stable codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`).
- **Status:** Approved. Date: 2026-10-21.

## DEC-017 — Pagination: offset for lists, cursor for messages

- **Context:** Listings/categories use page-based browsing (Amazon-like); messages use chronological cursor.
- **Selected:** `page`/`page_size` (default 20, max 100) for listings/search/categories/wishlist/conversations; `before`/`after` cursor for messages.
- **Status:** Approved. Date: 2026-10-21.

## DEC-018 — Frontend: Next.js App Router + React + Tailwind

- **Context:** Responsive marketplace UI with server components and client interactivity.
- **Selected:** Next.js (App Router), React 19, Tailwind CSS, React Hook Form + Zod for forms.
- **Status:** Approved. Date: 2026-10-21.

## DEC-019 — Testing stack

- **Context:** Need unit, integration, contract, security, component, E2E, a11y coverage.
- **Selected:** Vitest (unit/component via React Testing Library), Playwright (E2E + a11y via axe-core), contract tests against the OpenAPI spec.
- **Status:** Approved. Date: 2026-10-21.

## DEC-020 — CI/CD: GitHub Actions

- **Context:** Automated lint, typecheck, tests, build, deploy.
- **Selected:** GitHub Actions; deployments via Vercel integration; DB migrations via Prisma.
- **Status:** Approved. Date: 2026-10-21.

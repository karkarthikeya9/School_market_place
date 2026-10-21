# 05 — Technology Stack

Selection was made **after** requirements and architecture (DEC-001…DEC-020). One coherent stack is chosen; no competing framework is left unresolved. The stack is a single-language (TypeScript) modular monolith.

## Selected stack

| Layer | Selection |
|---|---|
| Language | TypeScript (strict) |
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS |
| Backend | Next.js route handlers (API) |
| Database | PostgreSQL (managed) |
| ORM | Prisma |
| Image storage | S3-compatible object storage (Vercel Blob for dev/preview) |
| Authentication | Auth.js v5 (Credentials) + Argon2id |
| Search | PostgreSQL full-text + `pg_trgm` |
| Messaging | Database-backed polling |
| Validation | Zod (shared schemas) |
| Testing | Vitest + React Testing Library + Playwright + axe-core |
| Containerization | Docker (optional, local Postgres) |
| CI/CD | GitHub Actions + Vercel |
| Deployment | Vercel (app) + Neon/Supabase (Postgres) + object storage |
| Observability | Structured JSON logs + `/api/v1/health` + optional Sentry |

## Justification per layer

### Language — TypeScript
- **Satisfies:** one language across frontend/backend so a **single shared Zod schema module** drives both runtime validation and the OpenAPI contract, minimizing contract drift between independent agents (a stated project risk).
- **Preferable to:** Python (FastAPI) would force two languages and a manual contract bridge, increasing drift risk for a multi-agent build. (Note: the local folder sits under a `Python` directory, but the prompt expresses no Python preference; this is flagged as a provisional decision — see OQ in tech-stack note.)
- **Complexity:** low for a web team; high tooling maturity.
- **Cost:** free.
- **Security:** strong typing reduces a class of injection/shape bugs; no runtime secrets in client bundles (server/client boundary explicit).
- **Deployment:** compiles to static/serverless on Vercel.
- **Risks:** full-stack framework coupling; mitigated by modular directory boundaries.

### Frontend — Next.js (App Router) + React + Tailwind
- **Satisfies:** responsive marketplace UI, server components for fast initial render of listings, client components for search/filter/chat forms.
- **Preferable to:** Vite+React SPA (no server rendering/SEO for public listings, needs separate API), Remix (smaller ecosystem for this team's tooling).
- **Complexity:** moderate.
- **Security:** SSR avoids exposing API internals; server actions avoided for state changes (explicit API preferred).
- **Deployment:** first-class Vercel support.

### Backend — Next.js route handlers
- **Satisfies:** the `/api/v1` contract inside the same repo/deploy; thin controllers over module services.
- **Preferable to:** a separate FastAPI/Django service (extra deployment + cross-service contract risk) or server actions (less explicit contract).
- **Deployment:** one deployable.

### Database — PostgreSQL
- **Satisfies:** ACID transactions for state transitions, FK/unique constraints for invariants, FTS for search (DEC-003).
- **Preferable to:** SQLite (concurrency), MySQL (FTS/trigram weaker), document stores (no relational integrity).

### ORM — Prisma
- **Satisfies:** typed, migration-managed access (DEC-004).
- **Preferable to:** Drizzle (Prisma has richer ecosystem/docs), raw SQL (loss of typing).

### Image storage — S3-compatible object storage
- **Satisfies:** durable, CDN-served images separate from the app (FR-IMG-*).
- **Preferable to:** local filesystem (not durable/portable), base64 in DB (bloat).
- **Security:** server-mediated writes; public read only.

### Authentication — Auth.js v5 (Credentials) + Argon2id
- **Satisfies:** email+password auth with session cookies and roles (DEC-013).
- **Preferable to:** rolling our own (risk), OAuth-only (students need a simple email path; OAuth is future scope).
- **Security:** Argon2id hashing, httpOnly/Secure cookie.

### Search — PostgreSQL FTS + trigram
- **Satisfies:** keyword search + partial match + filters (DEC-005).
- **Preferable to:** Meilisearch/OpenSearch (extra infrastructure for no MVP benefit).
- **Cost:** free within Postgres.

### Messaging — DB-backed polling
- **Satisfies:** private, persisted chat (DEC-006).
- **Preferable to:** WebSockets/SSE (non-requirements; more infra).

### Validation — Zod
- **Satisfies:** single source of truth for request/response shapes shared across frontend/backend and OpenAPI generation.

### Testing — Vitest + RTL + Playwright + axe-core
- **Satisfies:** the required test pyramid (DEC-019).

### CI/CD — GitHub Actions + Vercel
- **Satisfies:** automated lint/typecheck/test/build/deploy (DEC-020).

### Observability
- **Satisfies:** health check + structured logs + optional error tracking (NFR-OBS-001).

## AI

**No AI technologies are selected** because no requirement needs them (DEC-007). See `docs/09-ai-architecture.md`.

## Risks and migration considerations

- **Framework coupling:** single Next.js app; if a separate backend is ever required, the module services can be lifted out (boundaries already exist).
- **Prisma at scale:** fine for MVP; if throughput outgrows it, migrate hot paths to SQL later.
- **Managed-service lock-in (Neon/Supabase/Vercel Blob):** all use standard PostgreSQL/S3 interfaces, so migration is low-cost.
- **Free-tier limits:** Neon/Supabase and Vercel free tiers have storage/bandwidth/compute caps; documented in `docs/11-deployment.md`.

# 11 — Deployment Architecture

## Environment arrangement

Three environments are **not** mandated. For this scale, two are sufficient:

1. **Local development** (developer machine, Dockerized Postgres).
2. **Production** (Vercel + managed Postgres + object storage).

A dedicated **staging** environment is optional and recommended once the app is live (Vercel preview deployments serve as ad-hoc test environments during CI). CI preview deployments provide isolated, disposable test environments for E2E.

## Topology

```
Client (browser)
   │  HTTPS
   ▼
Vercel (Next.js app + /api/v1 route handlers)
   │
   ├── Postgres (Neon or Supabase)   ← Prisma, migrations
   └── Object storage (Vercel Blob / S3)  ← listing + profile images
```

- **Frontend & backend:** single Vercel deployment.
- **Database:** managed Postgres.
- **Image storage:** S3-compatible object storage (CDN-fronted).
- No separate worker/broker/queue (none required).

## Configuration

- **Environment variables** (see `.env.example`): `DATABASE_URL`, `DIRECT_URL` (Prisma), image storage credentials/endpoint, auth secret, admin seed email, optional Sentry DSN, app URL.
- **Secret management:** platform env vars (Vercel env), never committed. No developer-laptop-only files are required for a fresh deploy.

## Database migrations

- `prisma migrate deploy` runs during the production deploy step (Vercel build/start or a CI step).
- Migrations are committed; applied idempotently in order.

## CI/CD (GitHub Actions)

1. Checkout → install → lint → typecheck → unit/integration/contract tests.
2. Build.
3. E2E + a11y against a Vercel preview deployment (isolated DB).
4. Deploy to production (Vercel Git integration) with `prisma migrate deploy`.
5. Post-deploy smoke tests.

## Health checks

- `GET /api/v1/health` returns `{ status:"ok", db:"ok" }`; wired to a synthetic/uptime check.

## Backups and recovery

- **Backups:** managed Postgres daily automated backups (provider); document RPO/RTO.
- **Restore:** documented runbook; restore drilled at least once (NFR-BACKUP-002).
- **Images:** object storage versioning enabled (if supported) or bucket-level backup.

## Rollbacks

- Vercel instant rollback to the previous immutable deployment.
- DB rollbacks: forward-fix preferred; destructive migrations are additive-only (no destructive column drops without a two-step migration).

## Domain and HTTPS

- Custom domain with TLS; HSTS enabled; redirect HTTP→HTTPS.
- `APP_URL` drives cookie domain/secure flags.

## CORS / allowed origins

- Same-origin only; no cross-origin API consumers. CORS config restricted to the app origin.

## Deployment smoke tests

After every production deploy, verify: health endpoint 200, login, create a listing, search returns it, mark-sold removes it. Run as a CI post-deploy job.

## Operational cost

- Vercel Hobby/Pro + Neon/Supabase free tier + object-storage free tier for early-stage. Note free-tier limits (storage, bandwidth, compute, DB connections); scale up when exceeded. Costs are documented in the roadmap's Phase 9 checklist.

## Steps to a fresh deployment

1. Provision Postgres + object storage; note connection strings.
2. Configure Vercel project with env vars from `.env.example`.
3. Push repo; Vercel builds and runs migrations.
4. Run `scripts/seed-admin.mjs` to create the first admin (OQ-8).
5. Seed categories (`prisma db seed`).
6. Run smoke tests; enable custom domain + TLS.

These steps must actually be performed and verified before claiming deployment complete (per operating rules).

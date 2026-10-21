# 12 — Agent Contracts

The conceptual workflow is: **Project Manager → Architecture/API decisions → Backend & Frontend implementation → Tester verification.** These are roles in the OpenCode orchestration described in `AGENTS.md`; no specific multi-agent plugin is assumed.

## 12.1 Project Manager (PM)

**Owns:** product requirements, scope control, requirement identifiers, acceptance criteria, open questions, traceability, change approval.

**Must not:** silently alter architecture or API contracts after implementation begins; invent features; mark unexecuted work as done.

## 12.2 Architect / PM technical lead

**Owns:** system architecture, domain boundaries, database design, technology decisions, API contracts, security model, failure-handling, technical decision records.

**Must:** document consequential decisions (decision log) and their rationale; keep the OpenAPI spec and domain model authoritative.

## 12.3 Backend agent

**Owns:** backend implementation, Prisma models/migrations, API route handlers, domain validation, authorization enforcement, persistence, backend tests, API-contract compliance.

**Must:**
- Follow the approved schema and `docs/openapi.yaml` exactly.
- Not rename API fields, change status/condition enums, or introduce breaking changes.
- If a contract is inadequate, **propose a documented change and wait for approval** before proceeding.
- Report changed files, test commands, and actual outcomes.

## 12.4 Frontend agent

**Owns:** UI implementation, reusable components, routing/navigation, form behavior, API client integration, loading/empty/success/error states, responsive layouts, accessibility, frontend tests.

**Must:**
- Consume the approved API contract (`docs/06-api-contract.md` + `docs/openapi.yaml`) only.
- Not invent backend response fields or simulate production functionality the backend does not implement.
- Keep mock data isolated to development/testing; never in production data flows.
- Report changed files, test commands, and actual outcomes.

## 12.5 Tester agent

**Owns:** independent verification, test plans, regression tests, API/E2E validation, security/authorization checks, defect reports, release-gate recommendations.

**Must:**
- Not modify production implementation code as part of verification (may add/change test code, fixtures, and test docs only).
- Assign fixes to the appropriate implementation owner, not patch them silently.
- Report skipped tests and their reasons; never claim unexecuted tests passed.

## 12.6 Shared rules (all agents)

- Read `AGENTS.md` and the relevant docs before changing anything.
- Respect the approved architecture; keep changes focused (no unrelated refactors).
- Use consistent naming (see `docs/coding-standards.md`).
- Avoid duplicating business logic; add/update tests with code changes.
- Report assumptions, changed files, test commands, and **actual** outcomes.
- Never claim unverified success; never commit secrets or user data.

## 12.7 File ownership & shared-file coordination

| Area | Owner | Notes |
|---|---|---|
| `prisma/schema.prisma`, `prisma/migrations/**` | Backend | Frontend reads generated types only |
| `backend/...` (services, controllers, validation) | Backend | |
| `shared/` (Zod schemas, TS types) | Backend + Frontend | Changes require PM review (contract impact) |
| `docs/openapi.yaml` | Architect/PM | Changes gate implementation |
| `frontend/...` (components, pages, api client) | Frontend | |
| `tests/**` | Tester | Backend/Frontend contribute their own tests |
| `docs/**` | PM/Architect | Source of truth |

Shared files (`shared/`, `docs/openapi.yaml`, `prisma/schema.prisma`) are the highest contention points: changes to them must be reviewed before merging to avoid breaking the other agent's work. A PR touching `shared/` or `docs/openapi.yaml` requires explicit PM approval.

## 12.8 Inter-agent communication

- Backend may notify Frontend when the API contract changes (and vice-versa); Tester reports defects to the responsible owner.
- No agent delegates to itself; recursive delegation is not allowed to continue indefinitely; the PM remains responsible for the final result.

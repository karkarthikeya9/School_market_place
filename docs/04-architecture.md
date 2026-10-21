# 04 — System Architecture

## 1. Architecture choice

**Modular monolith** (one Next.js application) is selected (DEC-001). It is the simplest architecture satisfying the requirements: the MVP has ~10 bounded features, no independent scaling requirement, and no need for per-feature deployment isolation. Logical modules are enforced by directory structure and explicit module boundaries, not by network boundaries. This allows future extraction to separate services if a concrete requirement ever justifies it.

Alternatives considered and rejected for MVP:
- **Traditional monolith** (no module boundaries): meets requirements but risks a tangled codebase; the modular layout costs nothing extra.
- **Microservices:** unjustified — no team-isolation, independent-scaling, or polyglot requirements exist; it would multiply deployment and contract-drift risk without benefit.

## 2. Logical modules

| Module | Responsibility |
|---|---|
| Auth & accounts | Registration, login, session, roles, suspension |
| Profiles & affiliation | Public/private profile, university affiliation |
| Catalog & categories | Category taxonomy |
| Listings | Listing CRUD, lifecycle, images |
| Search & filtering | Query, filters, sort, pagination |
| Wishlist | Save/view/remove |
| Conversations & messaging | Threads, messages, participant authorization |
| Moderation | Reports, moderation actions, audit |
| Shared infra | DB client, config, validation, errors, logging |

Each module owns its entities, service functions, validation schemas, and API route handlers. Modules may call each other's **service functions** (never each other's HTTP handlers or DB tables directly), preserving boundaries while avoiding duplicated business logic.

## 3. Architecture decisions

| Concern | Decision |
|---|---|
| Frontend/backend boundary | Next.js App Router; React server/client components; API as route handlers under `/api/v1` |
| API layer | Route handlers = thin controllers → call module services → return JSON |
| Business logic | Service functions inside each module; validation with Zod at the boundary |
| Database access | Prisma (single client); repositories kept inside module service layer |
| Transaction boundaries | One Prisma `$transaction` per state-changing use case (e.g., create listing + attach images; mark sold; moderate) |
| Authentication | Auth.js v5 (Credentials) + Argon2id; JWT/session cookie (httpOnly, Secure, SameSite=Lax) |
| Authorization | Service-layer checks (role + ownership); never client-only |
| Image storage | Object storage (S3-compatible / Vercel Blob); DB stores key+URL+position; server-mediated write |
| Search | PostgreSQL FTS (`tsvector` + `ts_rank`) + `pg_trgm`; no dedicated engine |
| Messaging delivery | Database-backed polling (no WebSocket/SSE/broker) |
| Background jobs | None required in MVP |
| External integrations | None required beyond managed DB/storage (email provider only if OQ-7 verification enabled) |
| Error propagation | Central error mapper → error envelope (DEC-016) |
| Logging | Structured JSON logs; audit_log table for security events |
| Monitoring | `/api/v1/health`; optional Sentry for errors |
| Deployment topology | Single deployable (Vercel) + managed Postgres + object storage |
| Failure recovery | See `docs/failure-handling.md` |

**Not added (and why):** Redis (no caching/session-store need at MVP scale), message broker (no async work), worker service (no jobs), WebSockets (polling suffices). Each is documented as future scope only.

## 4. Synchronous vs asynchronous

- **Synchronous:** all request/response paths (auth, listing CRUD, search, messaging, wishlist, moderation).
- **Asynchronous:** none in MVP. (Email verification — if OQ-7 enabled — would be the first candidate for a background send, but can be synchronous at low volume.)

## 5. Data flows (sequence diagrams)

### 5.1 Registration and login

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth controller
    participant S as Auth service
    participant D as Postgres
    C->>A: POST /auth/register {email,password,display_name}
    A->>S: validate (Zod)
    S->>D: check email uniqueness
    D-->>S: result
    alt email taken
        S-->>A: CONFLICT
        A-->>C: 409 error envelope
    else ok
        S->>D: create user (hash) + profile [tx]
        S-->>A: user
        A-->>C: 201 + session cookie
    end
```

### 5.2 Create listing with images

```mermaid
sequenceDiagram
    participant C as Client
    participant L as Listings controller
    participant S as Listings service
    participant St as Object storage
    participant D as Postgres
    C->>L: POST /listings {title,...,condition}
    L->>S: validate + authorize (verified seller)
    S->>D: insert listing (draft) [tx]
    D-->>S: listing
    loop each image
        C->>L: POST /listings/{id}/images (multipart)
        L->>S: validate signature/size/type
        S->>St: store file (key)
        S->>D: insert listing_image (position)
    end
    C->>L: POST /listings/{id}/publish
    L->>S: authorize + check >=1 image
    S->>D: status draft->active, published_at
```

### 5.3 Search and filter

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Search controller
    participant D as Postgres
    C->>S: GET /listings?q=...&category_id=...&min_price=...&condition=...&sort=...&page=...
    S->>D: query active listings (FTS + filters + order + offset)
    D-->>S: rows + total
    S-->>C: {items,page,page_size,total,total_pages}
```

### 5.4 Open listing detail

```mermaid
sequenceDiagram
    participant C as Client
    participant L as Listings controller
    participant D as Postgres
    C->>L: GET /listings/{id}
    L->>D: load listing + images + seller summary
    alt active
        L-->>C: 200 detail
    else non-active and requester is owner/admin
        L-->>C: 200 detail (with status)
    else non-active and anonymous/other
        L-->>C: 404
    end
```

### 5.5 Send a message

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Messages controller
    participant S as Chat service
    participant D as Postgres
    C->>M: POST /conversations/{id}/messages {body}
    M->>S: authorize (participant, not suspended)
    S->>D: insert message, bump conversation.updated_at [tx]
    D-->>S: message
    S-->>C: 201 message
```

### 5.6 Add to wishlist

```mermaid
sequenceDiagram
    participant C as Client
    participant W as Wishlist controller
    participant S as Wishlist service
    participant D as Postgres
    C->>W: POST /wishlist {listing_id}
    W->>S: authorize (signed-in)
    S->>D: insert (user_id, listing_id) ON CONFLICT DO NOTHING
    D-->>S: result
    S-->>C: 201 (or 200 idempotent)
```

### 5.7 Mark sold

```mermaid
sequenceDiagram
    participant C as Client
    participant L as Listings controller
    participant S as Listings service
    participant D as Postgres
    C->>L: POST /listings/{id}/mark-sold
    L->>S: authorize (owner)
    S->>D: conditional update status=active->sold, sold_at [version check]
    alt stale version
        S-->>C: 409 CONFLICT
    else ok
        S-->>C: 200 listing
    end
```

### 5.8 Moderate a listing

```mermaid
sequenceDiagram
    participant C as Client (admin)
    participant M as Moderation controller
    participant S as Moderation service
    participant D as Postgres
    C->>M: POST /admin/listings/{id}/moderate {action,reason}
    M->>S: authorize (admin)
    S->>D: apply action + insert moderation_action + audit_log [tx]
    D-->>S: ok
    S-->>C: 200
```

## 6. Error propagation

Controllers throw typed domain errors → a central handler maps them to the error envelope (`docs/06-api-contract.md` §Error format). Unexpected errors are logged (no secrets) and returned as `INTERNAL` with no internals leaked.

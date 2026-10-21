# 06 — API Contract

- **Base path:** `/api/v1`
- **Style:** REST, JSON.
- **Machine-readable spec:** `docs/openapi.yaml` (OpenAPI 3.0). It is the authoritative definition; this document summarizes and explains semantics. If they ever diverge, the OpenAPI file wins and both must be updated.
- **Frontend contract:** the frontend consumes this contract exclusively (DEC-015). It must not invent fields or response shapes.

## 1. Conventions

### Authentication
Protected endpoints require a session cookie. Anonymous access returns `401`. Admin endpoints additionally require `role=admin`, else `403`.

### Authorization
- Listing mutations: owner or admin.
- Conversations/messages: participants only.
- Wishlist/profile self: owner only.
- Moderation: admin only.

### Identifiers
- Resource ids are UUIDs.

### Pagination
- Lists (listings, categories, wishlist, conversations, reports, seller listings): `page` (1-based, default 1), `page_size` (default 20, max 100).
- Response envelope for paginated lists: `{ "items": [...], "page": n, "page_size": n, "total": n, "total_pages": n }`.
- Messages use cursor pagination: `GET .../messages?limit=50&before=<message_id>` returns messages **older** than `before`, newest-first (the client reverses for display). `has_more` flag indicates more history.

### Sorting
`sort` ∈ `newest` (default), `relevance` (only meaningful with `q`), `price_asc`, `price_desc`. When `q` is present and no `sort` given, default is `relevance`; otherwise `newest`.

### Currency
Prices are integer **paise** internally. The API exposes `price` as a JSON number in rupees (e.g. `450.0`) plus `currency: "INR"`. Requests accept `price` in rupees; server converts to paise and validates `> 0`.

### Error envelope (DEC-016)
All errors return:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "details": [ { "field": "title", "issue": "too_short" } ] } }
```
Stable `code` values: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.

| Code | HTTP status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid/expired session |
| `FORBIDDEN` | 403 | Authenticated but not permitted (role or ownership) |
| `NOT_FOUND` | 404 | Resource missing or hidden from requester |
| `VALIDATION_ERROR` | 422 | Malformed/invalid input (with `details`) |
| `CONFLICT` | 409 | Duplicate, stale version, or illegal state transition |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL` | 500 | Unexpected server error (no internals leaked) |

For a missing non-active listing, the detail endpoint returns `404` (not `410`) to avoid leaking state to non-owners.

### Idempotency
- `POST /wishlist` is idempotent (unique constraint; re-save → `200`).
- `POST /conversations` returns the **existing** conversation if one already exists for `(listing_id, buyer)` → `200` with the existing id.
- State transitions (`publish`, `mark-sold`, `deactivate`, `reactivate`) are guarded and return `409 CONFLICT` if the transition is illegal (e.g., already sold).
- Mutation endpoints are **not** otherwise idempotent; retries of non-idempotent writes after a timeout must be avoided by the client.

### Rate limits
- Login/register: 10/min per IP (proposed).
- Message create: 60/min per user (proposed).
- Image upload: 10/min per user (proposed).
- Others: 300/min per user (proposed).
Return `429` with `RATE_LIMITED` when exceeded.

## 2. Endpoint families

### Auth

| Method/Path | Auth | Purpose |
|---|---|---|
| `POST /auth/register` | anon | Register (creates user + profile) |
| `POST /auth/login` | anon | Login |
| `POST /auth/logout` | user | Logout |
| `GET /me` | user | Current user + profile |
| `PATCH /me` | user | Update own profile |

**`POST /auth/register`** — body `{ email, password, display_name }`. Response `201` user (+ profile). Errors: `VALIDATION_ERROR`, `CONFLICT` (email taken).

**`POST /auth/login`** — body `{ email, password }`. Response `200` `{ user }`. Errors: `UNAUTHORIZED`, `FORBIDDEN` (suspended), `RATE_LIMITED`.

**`PATCH /me`** — body `{ display_name?, bio?, profile_image_url? }` (partial). Response `200` profile. Errors: `VALIDATION_ERROR`, `UNAUTHORIZED`.

### Categories / Universities

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /categories` | public | List categories |
| `GET /universities` | public | List universities (provisional) |

### Listings

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /listings` | public | Search/browse (active only) |
| `POST /listings` | verified seller | Create (draft) |
| `GET /listings/{id}` | public | Detail (active; owner/admin any status) |
| `PATCH /listings/{id}` | owner/admin | Edit |
| `DELETE /listings/{id}` | owner/admin | Soft delete → `removed` |
| `POST /listings/{id}/publish` | owner | `draft→active` |
| `POST /listings/{id}/mark-sold` | owner | `active→sold` |
| `POST /listings/{id}/deactivate` | owner/admin | `active→inactive` |
| `POST /listings/{id}/reactivate` | owner/admin | `inactive→active` |
| `GET /me/listings` | owner | Own listings (any status) |

**`GET /listings`** query params:
`q`, `category_id`, `category` (slug), `min_price`, `max_price`, `condition` (comma list), `sort`, `page`, `page_size`. Returns paginated active listings (each item includes seller summary + cover image).

**`POST /listings`** body:
```json
{ "title": "Engineering Mathematics", "description": "...", "price": 450.0, "category_id": "uuid", "condition": "very_good", "quantity": 1 }
```
Response `201` listing (`status: "draft"`). Images uploaded separately.

**`PATCH /listings/{id}`** — same body (partial). Rejects `sold`/`removed`. Includes `version` for optimistic concurrency; mismatch → `409`.

**Listing object** (response):
```json
{
  "id": "uuid", "title": "…", "description": "…",
  "price": 450.0, "currency": "INR",
  "condition": "very_good", "quantity": 1,
  "status": "active",
  "category": { "id": "uuid", "name": "Books & Textbooks", "slug": "books-textbooks" },
  "seller": { "id": "uuid", "display_name": "Arjun" },
  "images": [ { "id": "uuid", "url": "https://…", "position": 0 } ],
  "published_at": "…", "sold_at": null,
  "created_at": "…", "updated_at": "…"
}
```

### Images

| Method/Path | Auth | Purpose |
|---|---|---|
| `POST /listings/{id}/images` | owner | Upload (multipart `file`) |
| `DELETE /listings/{id}/images/{image_id}` | owner | Remove |
| `PATCH /listings/{id}/images/order` | owner | Reorder `{ image_ids: ["id0","id1",…] }` |

Upload constraints: JPEG/PNG/WebP, ≤5 MB (proposed), ≤5 images total. Server validates file signature and re-encodes/normalizes. Response `201` image object.

### Seller profiles

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /sellers/{seller_id}` | public | Public profile + summary |
| `GET /sellers/{seller_id}/listings` | public | Active listings (paginated) |

**Seller public object** (no private fields): `{ id, display_name, university?, profile_image_url?, bio?, active_listing_count }`.

### Conversations & messages

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /conversations` | user | My conversations |
| `POST /conversations` | user | Start/get conversation `{ listing_id }` |
| `GET /conversations/{id}` | participant | Thread meta |
| `GET /conversations/{id}/messages` | participant | History (cursor) |
| `POST /conversations/{id}/messages` | participant | Send `{ body }` |

**`POST /conversations`** — `{ listing_id }`. Errors: `NOT_FOUND` (listing not active), `CONFLICT`/`FORBIDDEN` (self-messaging → `422`/`403`; we return `422` `VALIDATION_ERROR` with `issue:"self_message"`). Returns `201` (new) or `200` (existing).

**Conversation object:** `{ id, listing: { id, title, status }, counterpart: { id, display_name }, last_message: {…}|null, updated_at, created_at }`.

**Message object:** `{ id, sender_id, body, created_at }`.

### Wishlist

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /wishlist` | user | List saved items |
| `POST /wishlist` | user | Save `{ listing_id }` |
| `DELETE /wishlist/{listing_id}` | user | Remove |

**Wishlist item object:** `{ listing_id, title, price, condition, status, cover_image_url, saved_at, available: bool }` where `available` is false when listing status ≠ active (shown as "Unavailable").

### Reports & moderation (admin)

| Method/Path | Auth | Purpose |
|---|---|---|
| `POST /reports` | user | Report a listing |
| `GET /admin/reports` | admin | List reports (filter `status`) |
| `POST /admin/reports/{id}/resolve` | admin | Resolve/dismiss `{ decision, note? }` |
| `POST /admin/listings/{id}/moderate` | admin | `{ action, reason }` |
| `POST /admin/users/{id}/suspend` | admin | Suspend user |
| `POST /admin/users/{id}/reactivate` | admin | Reinstate user |

`action` ∈ `deactivate|reactivate|remove`. Moderation writes `moderation_actions` + `audit_log`.

### Health

| Method/Path | Auth | Purpose |
|---|---|---|
| `GET /health` | public | Liveness/readiness `{ status:"ok", db:"ok" }` |

## 3. Database operations per endpoint

Summarized in the OpenAPI `x-db` extensions and detailed in `docs/04-architecture.md` §5. Key transactional operations: create listing + images (tx), mark-sold (conditional update), moderate (action + moderation_action + audit_log in one tx), send message (insert + bump `updated_at`).

## 4. Acceptance tests

Contract tests validate every endpoint against the OpenAPI spec (status codes, schemas, auth). See `docs/10-testing-strategy.md` §Core acceptance scenarios.

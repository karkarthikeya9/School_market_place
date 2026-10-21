# 02 — Functional and Non-Functional Requirements

Requirement identifiers are stable. Priority: **P0** (MVP-critical), **P1** (MVP), **P2** (should-have, MVP-later). Proposed measurement thresholds are marked **`[proposed]`** and require owner confirmation; they are not assumed facts.

Each functional requirement lists: ID, Description, Actor, Preconditions, Inputs, Output, Business rules, Error cases, Priority, Acceptance criteria, Related entities, Related endpoints, Related UI, Verification.

---

## 5.1 Functional requirements

### Authentication and accounts

#### FR-AUTH-001 — Register account
- **Description:** A visitor creates an account with email and password; a profile is created in the same operation.
- **Actor:** Visitor (unauthenticated).
- **Preconditions:** None.
- **Inputs:** `email` (valid format, unique), `password` (min 8 chars), optional `display_name`.
- **Output:** Created user + profile; session established (or pending email verification per OQ-7 provisional).
- **Business rules:** Email unique (case-insensitive); password hashed with Argon2id; default role `student`; status `active`.
- **Error cases:** `VALIDATION_ERROR` (bad email/short password), `CONFLICT` (email already registered).
- **Priority:** P0.
- **Acceptance criteria:** Given a valid email+password, registration succeeds and the account can authenticate; given a duplicate email, registration is rejected with `CONFLICT`.
- **Related entities:** `User`, `UserProfile`.
- **Related endpoints:** `POST /api/v1/auth/register`.
- **Related UI:** Registration screen.
- **Verification:** API integration test + E2E registration flow.

#### FR-AUTH-002 — Login
- **Description:** A user authenticates with email+password and receives a session.
- **Actor:** Visitor.
- **Preconditions:** Registered account.
- **Inputs:** `email`, `password`.
- **Output:** Session cookie; current-user payload.
- **Business rules:** Constant-time password verification; failed attempts rate-limited (see NFR-SEC-005); suspended accounts rejected.
- **Error cases:** `UNAUTHORIZED` (invalid credentials), `FORBIDDEN` (suspended).
- **Priority:** P0.
- **Acceptance criteria:** Valid credentials → authenticated; invalid → `401`; suspended → `403`.
- **Related endpoints:** `POST /api/v1/auth/login`.
- **Related UI:** Login screen.

#### FR-AUTH-003 — Logout
- **Description:** A user ends their session.
- **Actor:** Authenticated user.
- **Inputs:** None.
- **Output:** Session invalidated; cookie cleared.
- **Business rules:** Server-side session invalidation (not just client cookie removal).
- **Error cases:** Idempotent (logout when not authenticated succeeds silently).
- **Priority:** P0.
- **Acceptance criteria:** After logout, protected endpoints return `401`.
- **Related endpoints:** `POST /api/v1/auth/logout`.

#### FR-AUTH-004 — Session persistence
- **Description:** Session survives across requests via an httpOnly, Secure, SameSite=Lax cookie.
- **Priority:** P0.
- **Acceptance criteria:** Authenticated state persists across navigation; cookie is httpOnly/Secure.

#### FR-AUTH-005 — Password storage
- **Description:** Passwords are never stored in plaintext.
- **Business rules:** Argon2id (or a reviewed equivalent) with per-user salt.
- **Priority:** P0.
- **Verification:** Code review + unit test asserting no plaintext column; hash format check.

#### FR-AUTH-006 — Email verification **[provisional]**
- **Description:** A new account must confirm its email before creating a listing.
- **Actor:** User.
- **Priority:** P1 (depends on OQ-7).
- **Acceptance criteria:** Unverified user cannot create a listing; verification token is single-use and expiring.

#### FR-AUTH-007 — Roles
- **Description:** Users carry a role: `student` or `admin`.
- **Business rules:** Role assigned at registration (`student`); only admins grant admin (via seed/audit, OQ-8).
- **Priority:** P0.
- **Acceptance criteria:** Role is server-enforced; client cannot escalate.

#### FR-AUTH-008 — Account suspension (admin)
- **Description:** An admin may suspend a user.
- **Business rules:** Suspended users cannot authenticate or perform privileged actions; existing data retained; audit logged.
- **Priority:** P1.
- **Acceptance criteria:** Suspended user's login returns `403`; suspension recorded in `audit_log`.

---

### Student eligibility and university affiliation

#### FR-UNI-001 — University affiliation **[provisional]**
- **Description:** A profile records an optional `university_id`.
- **Priority:** P1 (depends on OQ-1/OQ-2).
- **Acceptance criteria:** Affiliation is shown on the seller profile; never used to infer unverified claims beyond display.

#### FR-UNI-002 — List universities **[provisional]**
- **Description:** Public endpoint returns the seeded university list for the registration/affiliation picker.
- **Priority:** P1.
- **Related endpoints:** `GET /api/v1/universities`.

---

### Profile management

#### FR-PROF-001 — Profile creation
- **Description:** A `UserProfile` is created automatically at registration.
- **Priority:** P0.

#### FR-PROF-002 — View public profile
- **Description:** Any user can view a seller's public profile (display name, university, image, active listings).
- **Business rules:** Excludes email, phone, credentials, and other private data.
- **Priority:** P0.
- **Acceptance criteria:** Public profile payload contains no private fields (asserted by contract test).
- **Related endpoints:** `GET /api/v1/sellers/{seller_id}`.
- **Related UI:** Seller profile screen.

#### FR-PROF-003 — Edit own profile
- **Description:** A user updates their own display name, bio, and profile image.
- **Business rules:** Only the owner; display name 1–80 chars; bio ≤ 500 chars (optional).
- **Error cases:** `FORBIDDEN` for non-owner; `VALIDATION_ERROR` for length violations.
- **Priority:** P1.
- **Related endpoints:** `GET/PATCH /api/v1/me`.

#### FR-PROF-004 — Profile privacy
- **Description:** No public endpoint exposes private account data.
- **Priority:** P0.

---

### Listing creation and management

#### FR-LIST-001 — Create listing (draft)
- **Description:** A user creates a listing in `draft` status.
- **Actor:** Authenticated, email-verified seller.
- **Inputs:** `title` (3–120 chars), `description` (≤ 4000 chars), `price`, `category_id`, `condition`, `quantity` (default 1), image refs.
- **Output:** Created `draft` listing.
- **Business rules:** Price validated (see FR-LIST price rule); condition must be in enum; category must exist.
- **Error cases:** `VALIDATION_ERROR`, `NOT_FOUND` (category).
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/listings`.
- **Related UI:** Create listing screen.

#### FR-LIST-002 — Publish listing
- **Description:** Owner transitions `draft → active`, making it visible in search/browse.
- **Business rules:** Requires ≥1 image (proposed); sets `published_at`.
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/listings/{id}/publish`.

#### FR-LIST-003 — Edit own listing
- **Description:** Owner edits title, description, price, category, condition, quantity, images while `draft`/`active`.
- **Business rules:** `sold`/`removed` listings are immutable (except moderation).
- **Error cases:** `FORBIDDEN` (non-owner), `CONFLICT` (terminal status).
- **Priority:** P0.
- **Related endpoints:** `PATCH /api/v1/listings/{id}`.

#### FR-LIST-004 — Mark sold
- **Description:** Owner transitions `active → sold`; sets `sold_at`.
- **Business rules:** Only from `active`; irreversible.
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/listings/{id}/mark-sold`.

#### FR-LIST-005 — Deactivate
- **Description:** Owner or admin transitions `active → inactive` (temporarily hidden).
- **Priority:** P1.
- **Related endpoints:** `POST /api/v1/listings/{id}/deactivate`.

#### FR-LIST-006 — Reactivate
- **Description:** Owner or admin transitions `inactive → active`.
- **Priority:** P1.
- **Related endpoints:** `POST /api/v1/listings/{id}/reactivate`.

#### FR-LIST-007 — Delete
- **Description:** Owner or admin transitions to `removed` (soft delete).
- **Business rules:** Soft delete; data retained for audit/conversation integrity.
- **Priority:** P1.
- **Related endpoints:** `DELETE /api/v1/listings/{id}`.

#### FR-LIST-008 — View listing detail
- **Description:** Anyone may view an `active` listing; owner/admin may view any status.
- **Business rules:** Non-owner requesting non-active status → `404`.
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/listings/{id}`.
- **Related UI:** Listing detail screen.

#### FR-LIST-009 — List own listings
- **Description:** Owner lists all their listings with status.
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/me/listings`.
- **Related UI:** My Listings screen.

#### FR-LIST-010 — Ownership enforcement
- **Description:** Only the owner (or admin) may mutate a listing.
- **Priority:** P0.
- **Acceptance criteria:** Student B cannot edit Student A's listing (`403`).

#### FR-LIST-011 — Quantity
- **Description:** A listing declares quantity (default 1) of an identical item.
- **Business rules:** Integer ≥ 1 (proposed cap 100).
- **Priority:** P1.

#### FR-LIST-012 — Availability invariant
- **Description:** `sold`, `inactive`, and `removed` listings are never returned as available in search/browse.
- **Priority:** P0.
- **Acceptance criteria:** Search/browse results contain only `active` listings (asserted by test).

---

### Image upload and storage

#### FR-IMG-001 — Upload image
- **Description:** Upload a product image for a listing.
- **Inputs:** image file.
- **Business rules:** Allowed formats JPEG/PNG/WebP; max 5 MB each (proposed); server-validated by content/signature, not filename/MIME.
- **Error cases:** `VALIDATION_ERROR` (type/size), `RATE_LIMITED`.
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/listings/{id}/images` (or signed upload; see `docs/06-api-contract.md`).

#### FR-IMG-002 — Multiple ordered images
- **Description:** A listing supports up to 5 images (proposed) with explicit order.
- **Priority:** P0.

#### FR-IMG-003 — Remove/replace image
- **Description:** Owner removes or reorders images.
- **Priority:** P1.

#### FR-IMG-004 — Safe rejection
- **Description:** Invalid/oversized uploads are rejected without corrupting the listing or leaving orphaned files accessible.
- **Priority:** P0.
- **Acceptance criteria:** Failed upload leaves listing intact and no public orphan file.

#### FR-IMG-005 — Storage access
- **Description:** Images are publicly readable; writes are owner-only and server-mediated.
- **Priority:** P0.

---

### Categories and conditions

#### FR-CAT-001 — List categories
- **Description:** Public list of categories for browse and listing creation.
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/categories`.

#### FR-CAT-002 — Assign category
- **Description:** A listing belongs to exactly one category.
- **Priority:** P0.

#### FR-CAT-003 — Condition enum
- **Description:** Condition is one of `new | like_new | very_good | good | acceptable`.
- **Priority:** P0.

---

### Search, filters, sorting, pagination

#### FR-SEARCH-001 — Keyword search
- **Description:** Full-text search over title + description.
- **Inputs:** `q`.
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/listings?q=…`.

#### FR-SEARCH-002 — Filter by category
- **Inputs:** `category_id` (or `category` slug).
- **Priority:** P0.

#### FR-SEARCH-003 — Filter by price range
- **Inputs:** `min_price`, `max_price` (inclusive, INR rupees).
- **Business rules:** `min_price ≤ max_price` when both present.
- **Priority:** P0.

#### FR-SEARCH-004 — Filter by condition
- **Inputs:** `condition` (comma-separated list).
- **Priority:** P1.

#### FR-SEARCH-005 — Combine filters
- **Business rules:** All filters are AND-combined; absent filters are ignored.
- **Priority:** P0.

#### FR-SEARCH-006 — Sort
- **Inputs:** `sort` ∈ `newest` (default), `relevance` (only with `q`), `price_asc`, `price_desc`.
- **Priority:** P0.

#### FR-SEARCH-007 — Paginate
- **Inputs:** `page` (1-based), `page_size` (default 20, max 100).
- **Output:** `{ items, page, page_size, total, total_pages }`.
- **Priority:** P0.

#### FR-SEARCH-008 — Only active listings
- **Description:** Search/browse return only `active` listings.
- **Priority:** P0.

#### FR-SEARCH-009 — Open listing from results
- **Description:** Result cards link to the detail page.
- **Priority:** P0.

---

### Seller profiles

#### FR-SELLER-001 — Display name
- **Description:** Public profile shows a display name.
- **Priority:** P0.

#### FR-SELLER-002 — University shown **[provisional]**
- **Priority:** P1.

#### FR-SELLER-003 — Profile image
- **Priority:** P2 (optional; only if UI spec requires it).

#### FR-SELLER-004 — Active listings
- **Description:** Seller profile lists that seller's active listings.
- **Priority:** P0.

#### FR-SELLER-005 — Listing → seller link
- **Description:** Detail page links to the seller profile.
- **Priority:** P0.

---

### Buyer–seller messaging

#### FR-CHAT-001 — Initiate conversation
- **Description:** A signed-in user starts a conversation about a listing with its seller.
- **Business rules:** Cannot message self (FR-CHAT-010); one conversation per buyer per listing; requires an `active` listing (proposed).
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/conversations`.

#### FR-CHAT-002 — Participants
- **Description:** Exactly two participants: the seller and the initiating buyer.
- **Priority:** P0.

#### FR-CHAT-003 — Persist messages
- **Description:** Messages are persisted with sender and timestamp.
- **Priority:** P0.

#### FR-CHAT-004 — Retrieve history
- **Description:** Participants retrieve the full message history (cursor-paginated, chronological).
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/conversations/{id}/messages`.

#### FR-CHAT-005 — List conversations
- **Description:** A user lists conversations they participate in (with last message + counterpart).
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/conversations`.

#### FR-CHAT-006 — Authorization
- **Description:** Only participants may read or post to a conversation; non-participants get `403`.
- **Priority:** P0.
- **Acceptance criteria:** Third user requesting conversation/messages → `403`.

#### FR-CHAT-007 — Message validation
- **Description:** `body` non-empty, ≤ 2000 chars (proposed), trimmed.
- **Error cases:** `VALIDATION_ERROR`.
- **Priority:** P0.

#### FR-CHAT-008 — Sold/inactive listing behavior
- **Description:** Existing conversations remain readable after the listing is sold/inactive; new conversations cannot start against non-active listings (proposed).
- **Priority:** P1.

#### FR-CHAT-009 — Deleted/suspended account behavior
- **Description:** Conversation history remains accessible to the remaining participant; suspended/deleted users are shown as "Unavailable" counterpart and cannot post.
- **Priority:** P1.

#### FR-CHAT-010 — No self-messaging
- **Description:** A user cannot message themselves about their own listing.
- **Priority:** P0.

#### FR-CHAT-011 — Polling
- **Description:** Client retrieves new messages via cursor + periodic refresh (no server push in MVP).
- **Priority:** P0.

---

### Wishlist

#### FR-WISH-001 — Save listing
- **Description:** A signed-in user saves a listing to their wishlist.
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/wishlist`.

#### FR-WISH-002 — View wishlist
- **Description:** List saved items with current availability.
- **Priority:** P0.
- **Related endpoints:** `GET /api/v1/wishlist`.

#### FR-WISH-003 — Remove item
- **Description:** Remove a saved listing.
- **Priority:** P0.
- **Related endpoints:** `DELETE /api/v1/wishlist/{listing_id}`.

#### FR-WISH-004 — No duplicates
- **Description:** Unique `(user_id, listing_id)`; saving an already-saved item is idempotent.
- **Priority:** P0.

#### FR-WISH-005 — Persist across sessions
- **Description:** Wishlist survives logout/login.
- **Priority:** P0.

#### FR-WISH-006 — Unavailable item behavior
- **Description:** A saved item whose listing is `sold`/`inactive`/`removed` is shown as "Unavailable" (with status) and can be removed; it is not silently deleted.
- **Priority:** P0.

---

### Availability and sold status

#### FR-AVAIL-001 — Sold invariant
- **Description:** After `mark-sold`, the item is never offered as available anywhere.
- **Priority:** P0.

---

### Moderation and administration

#### FR-MOD-001 — Report listing
- **Description:** A signed-in user reports a listing (one reason + optional note).
- **Priority:** P1 (per OQ-10 provisional).
- **Related endpoints:** `POST /api/v1/reports`.

#### FR-MOD-002 — List reports (admin)
- **Description:** Admins list open reports.
- **Priority:** P1.
- **Related endpoints:** `GET /api/v1/admin/reports`.

#### FR-MOD-003 — Moderate (admin)
- **Description:** Admin deactivates, reactivates, or removes a listing.
- **Priority:** P0.
- **Related endpoints:** `POST /api/v1/admin/listings/{id}/moderate`.

#### FR-MOD-004 — Record moderation action
- **Description:** Every moderation action is recorded in `moderation_actions` and `audit_log`.
- **Priority:** P0.

---

### Logging and audit

#### FR-AUDIT-001 — Audit log
- **Description:** Security-relevant events (moderation, suspension, role changes) are written to `audit_log`.
- **Priority:** P0.

#### FR-AUDIT-002 — Structured logs
- **Description:** Structured (JSON) logs; no passwords, tokens, or full message bodies logged.
- **Priority:** P1.

---

### Notifications

**Not in MVP.** No email/push notification requirements are approved. (Future scope; see `docs/09-ai-architecture.md` / roadmap.)

---

## 5.2 Non-functional requirements

Thresholds marked `[proposed]` are initial targets for an academic/early-stage marketplace and require confirmation; they are not production-capacity promises.

| ID | Category | Requirement | Target (proposed) | Measurement |
|---|---|---|---|---|
| NFR-PERF-001 | Performance | Listing list/search response | p95 < 500 ms for ≤10k listings | Load test (k6) on staging |
| NFR-PERF-002 | Performance | Detail page response | p95 < 300 ms | Synthetic check |
| NFR-PERF-003 | Performance | Image delivery | Via CDN/object storage | Observed asset TTFB |
| NFR-SEC-001 | Security | All secrets encrypted/env-managed; never committed | 0 committed secrets | Secret-scanning in CI |
| NFR-SEC-002 | Security | TLS everywhere | HTTPS enforced (HSTS) | Header audit |
| NFR-SEC-003 | Security | Least-privilege DB account | App DB role without DDL at runtime | DB role audit |
| NFR-SEC-004 | Security | Dependency vulnerabilities | 0 high/critical at release | `npm audit` / Dependabot gate |
| NFR-SEC-005 | Security | Auth rate limiting | e.g. 10 login attempts/IP/15 min | Rate-limit test |
| NFR-REL-001 | Reliability | Data persistence across restart | All durable state in Postgres/object storage | Restart smoke test |
| NFR-REL-002 | Reliability | No partial listing on failed image upload | Transaction/rollback behavior | Integration test |
| NFR-AVAIL-001 | Availability | Health check endpoint | `/api/v1/health` returns 200 | Deployment smoke test |
| NFR-SCAL-001 | Scalability | Stateless app tier | Horizontal scale via platform | Architecture review (no in-process state) |
| NFR-MAINT-001 | Maintainability | Single source of truth for contracts | Shared Zod schemas + OpenAPI | CI contract-diff check |
| NFR-MAINT-002 | Maintainability | Type safety | `strict` TypeScript, 0 type errors | CI typecheck |
| NFR-ACC-001 | Accessibility | WCAG 2.2 AA | No critical/serious violations | axe-core in Playwright |
| NFR-ACC-002 | Accessibility | Keyboard operable | All flows keyboard-navigable | E2E keyboard tests |
| NFR-PRIV-001 | Privacy | No private data on public endpoints | Contract test asserts absence | Contract test |
| NFR-PRIV-002 | Privacy | Data minimization | Collect only required fields | Review |
| NFR-OBS-001 | Observability | Structured logs + error tracking | JSON logs; optional Sentry | Log sample review |
| NFR-DATA-001 | Data integrity | FK + unique constraints enforce invariants | Referential integrity enforced by DB | Migration + test |
| NFR-DATA-002 | Data integrity | No float currency | Integer minor units | Schema review |
| NFR-BROWSER-001 | Browser compat | Last 2 major versions of Chrome/Firefox/Safari/Edge | Works on all | E2E matrix |
| NFR-RESP-001 | Responsive | Usable on 320px–1920px viewports | No horizontal scroll/overflow | Responsive E2E |
| NFR-BACKUP-001 | Backup | Automated DB backups | Daily (managed provider) | Provider config |
| NFR-BACKUP-002 | Recovery | Documented restore procedure | Restore tested once | Runbook + drill |

## 5.3 Business rules

| # | Rule |
|---|---|
| BR-01 | Only the owner (or an admin) may create/edit/deactivate/delete a listing. |
| BR-02 | Allowed listing states: `draft`, `active`, `sold`, `inactive`, `removed` (transitions in `docs/03-domain-model.md`). |
| BR-03 | `sold`/`inactive`/`removed` listings are excluded from search/browse; only `active` listings are "available". |
| BR-04 | Sold listings are terminal and cannot be reactivated (they remain resolvable to owner/participants only). |
| BR-05 | Available conditions: `new`, `like_new`, `very_good`, `good`, `acceptable`. |
| BR-06 | Categories do not require extra fields in MVP (flat list). |
| BR-07 | Price is a positive number, stored as integer paise (≥ ₹0.01), validated `> 0`. |
| BR-08 | A listing has 0–5 ordered images (proposed); publish requires ≥1 image (proposed). |
| BR-09 | A user cannot message themselves. |
| BR-10 | Users cannot start a conversation about a non-active listing (proposed); existing conversations persist. |
| BR-11 | Duplicate wishlist entries are not allowed; re-saving is idempotent. |
| BR-12 | Ownership is enforced server-side on every mutation (never client-only). |
| BR-13 | Concurrent updates use optimistic concurrency: writes include a version or are validated transactionally; last-write-wins is avoided where a stale write would corrupt state (see `docs/failure-handling.md`). |
| BR-14 | Suspended sellers' existing listings are deactivated for public visibility (proposed) but retained; suspended users cannot authenticate. |

Open behavioral questions (not invented rules) are tracked in `docs/open-questions.md` (OQ-9 sold visibility, OQ-10 reporting, OQ-7 verification).

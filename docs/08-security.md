# 08 — Security Model

Security is part of the initial design and is enforced **server-side** (least privilege). The client never performs authorization.

## 1. Identity and authorization

- **Registration/authentication:** email + password; Argon2id hashing (DEC-013); session via httpOnly, Secure, SameSite=Lax cookie.
- **Session management:** server-side session record; logout invalidates the session (not just the cookie); sliding expiry optional.
- **Roles:** `student` (default) and `admin`. Role stored on the user and read from the server session — never trusted from the client.
- **Listing ownership:** only the `seller_id` owner (or an admin) may mutate a listing.
- **Profile privacy:** public seller object exposes only `display_name`, `university` (if enabled), `profile_image_url`, `bio`, `active_listing_count`. Email, phone, credentials are never exposed.
- **Conversation authorization:** only the two participants may read/post; non-participants receive `403`.
- **Wishlist ownership:** only the owning user may read/remove.
- **Administrative access:** admin-only routes verify role; audit-logged.
- **Account suspension:** suspended users cannot authenticate or act; existing data retained.
- **Student verification (if OQ-2 enabled):** email-domain check + confirmation token.

## 2. Application security (OWASP-aligned)

| Risk | Mitigation |
|---|---|
| Broken access control / IDOR | Service-layer authorization on every resource; ownership checks by id |
| SQL injection | Prisma parameterized queries (no string-built SQL) |
| XSS | React auto-escaping; no `dangerouslySetInnerHTML` for user content; CSP header |
| CSRF | SameSite=Lax cookie + same-origin fetch; no cross-site state changes |
| Authentication abuse | Rate-limited login/register; Argon2id; generic invalid-credentials message |
| Brute force | Per-IP login rate limit (NFR-SEC-005) |
| Rate limiting | Per-user/per-IP limits on auth, messaging, uploads |
| Sensitive data exposure | Public/private DTO separation; no secrets in client bundle |
| Unsafe redirects | No open redirects; return paths validated to internal routes |
| Mass assignment | Zod schemas whitelist fields; no spread of raw request into models |
| Session theft | httpOnly cookie, Secure in prod, logout invalidation |
| Dependency vulnerabilities | CI `npm audit`/Dependabot; 0 high/critical at release |
| Security headers | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS |
| CORS | Same-origin only; no cross-origin API consumers in MVP |
| Secrets exposure | Env-only secrets; `.env` gitignored; secret scanning in CI |

## 3. Image upload security

- **Formats:** JPEG, PNG, WebP only.
- **Max size:** 5 MB each (proposed); max 5 images per listing (proposed).
- **Validation:** file-signature (magic bytes) and decode check — **not** filename or browser MIME alone.
- **Processing:** re-encode/normalize server-side; strip metadata (EXIF).
- **Filename handling:** generated storage keys; never user-supplied filenames.
- **Storage permissions:** object storage is write-through-server-only; objects are public-read.
- **Rate limits:** upload per-user limit.
- **Orphan/unauthorized removal:** images removed with the listing (or explicitly); failed uploads leave no orphan public object.

## 4. Data protection

- **Classification:** public (listing content, seller public profile), private (email, password hash, conversations, wishlist, reports, audit).
- **Passwords:** Argon2id (never logged, never plaintext).
- **Transport:** HTTPS only (HSTS).
- **Database permissions:** app runtime role has DML but no DDL; migrations run with elevated, short-lived credentials.
- **Secret management:** environment variables injected by the platform; never in Git.
- **Retention:** conversations retained (participant access); no auto-purge in MVP. Wishlist/reports retained until removed/resolved.
- **Account deletion:** MVP supports suspension (not hard deletion); a deletion flow is future scope and must address conversation history per the retention rule.
- **Audit logging:** moderation, suspension, role changes → `audit_logs` (append-only).
- **Log hygiene:** never log passwords, session tokens, secrets, or full message bodies.

## 5. Threat checklist (enforcement locations)

| Check | Enforced at |
|---|---|
| Ownership | Service layer (backend) |
| Role | Session + service layer |
| Input validation | Zod at API boundary |
| Output shaping | DTO mapping (no raw model serialization) |
| AuthN | Middleware/route handler |
| Rate limiting | Middleware |
| Secrets | Environment + CI scanning |

# Open Questions

This document lists unresolved product decisions. Each entry explains **why it matters**, the **available options**, and **which later decisions depend on it**. These are genuine decisions that materially affect the database, API, security, and/or architecture. They must be answered by the project owner before (or as early as possible during) implementation.

Provisional recommendations are provided so that planning can proceed, but they are **not approved decisions**. A provisional choice is recorded in `docs/decision-log.md` with status `Provisional`.

---

## OQ-1 — Single-university vs multi-university access

- **Why it matters:** Determines whether a `University` entity and university-scoping/affiliation logic exist at all. Changes the schema, registration flow, seller profiles, and search scoping.
- **Options:**
  1. **Single university** — no `University` table needed; affiliation is implicit/constant.
  2. **Multi-university** — a `University` table with `email_domain`, user selects/verifies affiliation at registration.
- **Depends on:** OQ-2 (verification mechanism), domain model (`docs/03-domain-model.md`), registration API, seller profile UI.
- **Provisional recommendation:** Start with a **multi-university-capable** model (a `University` table) because it is cheap to include and avoids a later schema migration, but seed exactly one university initially. This keeps the door open without speculative complexity.
- **Status:** Open.

## OQ-2 — Student affiliation / verification

- **Why it matters:** Determines whether registration is gated (and how), what "student" means in the data model, and how much trust the platform places in affiliation claims.
- **Options:**
  1. **No verification** — anyone can register; affiliation is self-declared (displayed but unverified).
  2. **Email-domain verification** — require a `.edu`/university-domain email and (optionally) confirm it.
  3. **Manual/administrator verification** — an admin approves accounts (highest friction).
  4. **SSO via university identity provider** — most robust, largest integration effort.
- **Depends on:** OQ-1, registration flow, security model, admin moderation.
- **Provisional recommendation:** **Email-domain verification (option 2)** as a light default: registration requires a university-domain email; a verification token is emailed and must be confirmed before the account can publish listings. This balances trust with low implementation cost. It can be relaxed if the owner wants an open marketplace.
- **Status:** Open.

## OQ-3 — Transaction model: contact-and-meet vs online checkout

- **Why it matters:** Determines whether the product includes payments, a cart, order state, and fulfillment — a massive scope difference. It also determines what "mark sold" means and what messaging must support (arranging meetup vs completing purchase).
- **Options:**
  1. **Contact-and-meet (no payment)** — chat is used to arrange the transaction offline; "mark sold" is a manual seller action. No cart/checkout/payment.
  2. **Online checkout** — a payment processor, cart, order/fulfillment state, escrow or refunds.
- **Consequences:**
  - Option 1 keeps the MVP aligned with the stated non-goals (no payments, no cart, no checkout, no escrow) and is substantially cheaper/simpler. Trade-off: the platform cannot guarantee completion or capture a fee.
  - Option 2 introduces significant scope: PCI-scoped integrations, order lifecycle, refunds, and legal/compliance obligations; it contradicts the current non-goal list.
- **Depends on:** Listing "sold" semantics, messaging UX, security model (PCI), deployment cost, roadmap.
- **Provisional recommendation:** **Contact-and-meet (option 1)** for the MVP, consistent with the explicit non-goals.
- **Status:** Open.

## OQ-4 — Real-time messaging vs polling

- **Why it matters:** Determines whether the architecture includes WebSockets/push infrastructure, background workers, or simply database-backed polling. Affects `docs/04-architecture.md`, tech stack, and deployment.
- **Options:**
  1. **Database-backed polling** (fetch on load + periodic refresh).
  2. **Server-Sent Events (SSE)** for near-real-time delivery.
  3. **WebSockets** (full real-time, typing/read receipts possible).
- **Depends on:** Messaging architecture, tech stack, deployment.
- **Provisional recommendation:** **Database-backed polling (option 1)** for the MVP. Real-time delivery, typing indicators, and read receipts are explicitly non-requirements. Polling keeps the modular monolith simple and stateless.
- **Status:** Open.

## OQ-5 — Deployment target and budget

- **Why it matters:** Determines hosting provider choices, whether a paid Postgres/object-storage tier is acceptable, and CI/CD configuration.
- **Options:** Vercel + managed Postgres (Neon/Supabase) + object storage (free tiers), vs self-hosted, vs AWS/GCP, vs a university-provided environment.
- **Depends on:** `docs/11-deployment.md`, tech stack finalization, `.env` structure.
- **Provisional recommendation:** **Vercel + Neon/Supabase Postgres + Vercel Blob (or S3)**, using free tiers for an early-stage build.
- **Status:** Open.

## OQ-6 — Single-developer academic build vs team-based multi-agent build

- **Why it matters:** Affects how much process (agent contracts, branch rules, PR review) is worth carrying, and whether the repo is optimized for one editor or for parallel agents.
- **Options:**
  1. **Team/multi-agent** — full agent contracts, feature branches, review gates.
  2. **Single developer** — lighter process, still with the same documentation as source of truth.
- **Depends on:** `docs/12-agent-contracts.md`, coding standards, branch strategy.
- **Provisional recommendation:** Assume a **team-based multi-agent build** (the documentation is written so multiple agents can work in parallel), but keep the process lightweight enough to be usable by one person.
- **Status:** Open.

## OQ-7 — Email verification requirement at registration

- **Why it matters:** Affects whether accounts can act immediately after registration or must confirm email first (security posture + UX).
- **Options:** Require email confirmation before publishing listings; allow browsing + chat after confirmation but block listing; or no confirmation.
- **Depends on:** OQ-2, registration API, security model.
- **Provisional recommendation:** Require **email confirmation before a user can create a listing**; allow browsing without an account. (Tied to OQ-2 provisional.)
- **Status:** Open.

## OQ-8 — Administrator identity and provisioning

- **Why it matters:** Determines how the first admin is created and how additional admins are granted the role (secure provisioning vs self-service).
- **Options:**
  1. Seed script promotes a specific email to `admin`.
  2. Admin user-role managed by other admins via UI.
  3. Environment-variable-allowlisted admin emails.
- **Depends on:** Moderation, security model, deployment seed instructions.
- **Provisional recommendation:** **Seed script** promotes a configured email to `admin`, with a documented, audited procedure for adding more admins (no public self-service).
- **Status:** Open.

## OQ-9 — Sold/removed listing visibility policy

- **Why it matters:** Affects whether sold listings remain viewable (read-only) to the public, and whether conversation/wishlist references can still resolve.
- **Options:**
  1. Sold listings hidden from public search/browse but still resolvable by direct link with a "Sold" banner (read-only).
  2. Sold listings fully private (owner-only).
- **Depends on:** Listing lifecycle, wishlist "unavailable" behavior, conversation retention.
- **Provisional recommendation:** **Option 1** — sold/inactive/removed listings are excluded from search and browse; the owner (and existing conversation participants/wishlist holders via embedded status) can still see a read-only representation with the correct status. The public detail endpoint returns the listing only when `active` (or to the owner/admin for any status).
- **Status:** Open.

## OQ-10 — Moderation reporting by users

- **Why it matters:** Determines whether a `Report` entity and "Report this listing" UI are in the MVP, or whether moderation is admin-initiated only.
- **Options:**
  1. Admin-initiated moderation only (no user reports) — smallest scope.
  2. Add a "Report listing" action that creates a `Report` for admin review.
- **Depends on:** Moderation module, admin UI, `Report` entity.
- **Provisional recommendation:** **Include a minimal "Report listing" action (option 2)** because a marketplace without a reporting channel is operationally unsafe; keep it to one reason + optional note.
- **Status:** Open.

---

## Consolidated priority

1. **OQ-3** (transaction model) — blocks listing "sold" semantics and messaging UX; highest rework risk.
2. **OQ-1 / OQ-2** (university + verification) — block schema and registration.
3. **OQ-5** (deployment/budget) — blocks tech-stack finalization and deployment doc.
4. **OQ-4** (messaging delivery) — medium rework risk (polling is a safe default).
5. **OQ-6** (build mode) — affects process weight, not schema.
6. **OQ-7 / OQ-8 / OQ-9 / OQ-10** — smaller, localizable decisions.

Decisions are **not** blocked while these are open: the blueprint proceeds with the provisional recommendations above, which are clearly labeled and cheap to change before their dependent phase begins.

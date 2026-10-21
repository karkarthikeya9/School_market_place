# 01 — Product Definition

## 1. Product summary

The **Student Marketplace** is a web application where students discover, list, and communicate about second-hand goods (textbooks, electronics, furniture, and other permitted items). It provides a complete buyer discovery journey, seller listing workflows, private buyer–seller messaging, and persistent wishlists. It is inspired by Amazon.com's marketplace patterns, adapted to student-to-student transactions, and is deliberately **not** an Amazon clone: there is no shared catalog, no payments, no cart, no checkout, no reviews, and no recommendation engine in the MVP.

## 2. Problem statement

Students frequently need to buy and sell second-hand goods such as textbooks, electronics, furniture, and other useful items. A centralized marketplace lets students discover listings, inspect item details, find sellers, save items for later, and communicate with sellers — all within one authenticated, moderated environment.

## 3. Target users and stakeholders

- **Buyers:** students browsing and purchasing second-hand goods.
- **Sellers:** students listing goods they want to sell.
- **Administrators:** responsible for moderation and platform integrity.

## 4. User needs and core use cases

1. Discover relevant second-hand goods by searching and browsing (with filters and sorting).
2. Inspect a listing's details (images, title, description, price, condition, category).
3. Contact a seller privately to ask questions or arrange a transaction.
4. Save interesting listings and return to them later.
5. Publish and manage one's own listings through a defined lifecycle.
6. Mark a sold item as sold so it is no longer offered as available.
7. Maintain a profile that other users can view without exposing private data.
8. (Admin) Moderate prohibited or suspicious listings with recorded, audited actions.

## 5. Product goals

- Complete buyer discovery journey (search → filter → inspect → contact → save).
- Full seller journey (publish → manage → mark sold).
- Private buyer–seller messaging.
- Persistent wishlist across sessions.
- Protected accounts, private conversations, and clear ownership rules.
- Reliable on desktop and mobile browsers.
- Deployable to a public production environment.
- Verifiable through automated tests.

## 6. Explicit non-goals (MVP)

- Amazon-scale distributed infrastructure or microservices.
- AI recommendations, personalized ranking, or LLM-powered search.
- Payment processing, shopping cart, online checkout, escrow.
- Delivery tracking, automated shipping, commission calculations.
- Seller subscriptions, advertising, loyalty programs, promotional campaigns.
- Native Android/iOS applications.
- Seller ratings/reviews/badges/reputation (unless later approved).

## 7. MVP boundaries

**In scope:** authentication & accounts; profiles & (provisional) university affiliation; listing CRUD + lifecycle; image upload; categories & conditions; search/filter/sort/paginate; listing detail; seller profile; messaging; wishlist; basic moderation + audit logging.

**Out of scope:** everything in §6 plus multi-list wishlist sharing, real-time messaging, and dedicated search engines.

## 8. Future scope (clearly separated)

These are **not** MVP and require separate approval:
- Email/social SSO, passwordless sign-in.
- Multi-university directory and university-scoped search.
- Real-time messaging (SSE/WebSockets), read receipts, typing indicators, attachments.
- Multiple named/shared wishlists, price-drop notifications.
- Seller ratings/reviews/reputation.
- Dedicated search service (Meilisearch/OpenSearch), relevance tuning.
- Payments/checkout/escrow (only if OQ-3 is resolved the other way).
- AI-assisted listing drafting or moderation (see `docs/09-ai-architecture.md`).
- Native mobile apps.

## 9. Success criteria

Measurable, verifiable outcomes for the MVP (thresholds proposed, to be confirmed):

| # | Criterion | Target |
|---|---|---|
| S1 | Buyer can complete discovery end-to-end | Search → filter → open detail → contact seller, in one session |
| S2 | Seller can publish a listing | Valid listing created and visible to others within one session |
| S3 | Sold items never shown as available | 0 cases where a `sold`/`inactive`/`removed` listing appears in search/browse |
| S4 | Wishlist persistence | Saved item survives logout/login and remains until removed or marked unavailable |
| S5 | Message privacy | Non-participant receives `403` for conversation/message access (verified by test) |
| S6 | Test coverage gate | CI passes unit/integration/contract/E2E/a11y suites (see `docs/10-testing-strategy.md`) |
| S7 | Deployability | Clean deploy from `.env.example` + migrations + seed → health checks pass |

## 10. Product constraints

- Web application only (desktop + mobile browsers).
- Prices in INR (assumption — flagged).
- Students may buy and sell with the same account.
- No payment processing in MVP (per non-goals).
- Moderation must be present for safe operation (proportionate, not elaborate).

## 11. Assumptions

Recorded from the brief; **not verified facts** (see `docs/open-questions.md`):

- Initially a web application.
- Primary audience is students.
- Listings represent individual goods or explicitly declared quantities.
- Listings have a defined availability status.
- Search results include only eligible active listings by default.
- Wishlist and chat require authentication.
- One account can both buy and sell.
- Prices use INR (initial market: India).
- No payment processing in MVP.
- Student eligibility, university boundaries, and verification remain unresolved.

## 12. Unresolved decisions

See `docs/open-questions.md`. Summary: transaction model (OQ-3), university scope (OQ-1), verification (OQ-2), messaging delivery (OQ-4), deployment/budget (OQ-5), build mode (OQ-6), plus OQ-7…OQ-10.

## 13. User personas

- **Priya (buyer):** final-year student looking for a used engineering textbook and a desk lamp; wants to search, compare conditions/prices, save options, and message sellers to confirm condition before deciding.
- **Arjun (seller):** student selling a second-hand laptop and old textbooks; wants a quick listing flow with photos, honest condition, and an easy way to mark items sold and respond to buyers.
- **Maya (admin):** platform operator (or university staff) who reviews reported listings, deactivates prohibited items, and needs a record of moderation actions.

## 14. End-to-end user journeys

Each journey lists preconditions, actions, system responses, success/failure conditions, and auth requirements.

### Buyer journey
- **Preconditions:** public internet access; browsing requires no account (contacting/saving requires sign-in).
- **Actions:** open marketplace → search or browse → apply filters → inspect listing → view seller → initiate chat → (per OQ-3 provisional) arrange transaction offline.
- **System responses:** render results; return matching active listings; show detail page with gallery/price/condition/seller; create or open a conversation; persist messages.
- **Success:** buyer finds an eligible listing and starts a private conversation with the seller.
- **Failure:** no matches (empty state); unauthorized action redirected to login; listing becomes unavailable mid-view (clear "unavailable" state).
- **Auth:** browse = anonymous; save/contact = authenticated.

### Seller journey
- **Preconditions:** signed-in, email-verified account (provisional).
- **Actions:** sign in → create listing (draft) → upload images → publish → manage listing → respond to messages → mark sold.
- **System responses:** validate and persist; store images; publish to active; list own listings; route messages; transition to sold.
- **Success:** listing published and later marked sold; sold item removed from availability.
- **Failure:** validation errors; image upload failure; unauthorized edit by another user rejected.
- **Auth:** authenticated seller; ownership enforced.

### Wishlist journey
- **Preconditions:** signed-in user.
- **Actions:** discover listing → save → view saved items later → remove, or observe an unavailable item.
- **System responses:** insert unique wishlist entry; list saved items with current availability status; remove on request; mark "Unavailable" when listing is sold/inactive/removed.
- **Success:** item persists across sessions; duplicate saves prevented.
- **Failure:** duplicate save idempotently handled; unavailable item clearly indicated.
- **Auth:** authenticated.

### Account journey
- **Preconditions:** none.
- **Actions:** register → authenticate → manage profile → manage listings/wishlist/conversations.
- **System responses:** create account + profile; establish session; persist profile edits; expose own resources with ownership checks.
- **Success:** user manages their own data; private data never exposed on public profile.
- **Failure:** invalid credentials; duplicate email; session expiry redirects to login.
- **Auth:** register/login anonymous; the rest authenticated.

### Administrator journey
- **Preconditions:** authenticated account with `admin` role.
- **Actions:** authenticate → inspect reported/suspicious listings → take a moderation action → record it.
- **System responses:** list reports; fetch listing (any status); apply deactivate/reactivate/remove; write `moderation_actions` + `audit_log`.
- **Success:** action applied and persisted with an audit record.
- **Failure:** non-admin attempts moderation → `403`.
- **Auth:** admin role required (least privilege).

## 15. Scope acceptance and change-control rules

- The five explicit MVP capabilities (A–E in the brief) are the source of truth for feature scope.
- Any new feature must be traced to an approved requirement or a new owner-approved requirement; it may not enter the MVP silently.
- Requirement IDs are stable (`FR-*`/`NFR-*`); changes to an ID's meaning require a decision-log entry.
- API contract changes after implementation begins require a documented change and owner approval (see `docs/12-agent-contracts.md`).
- Unresolved decisions stay in `docs/open-questions.md` until the owner resolves them; they are never silently converted into approved requirements.

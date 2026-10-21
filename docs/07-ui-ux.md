# 07 — UI/UX Specification

Amazon.com patterns (documented in `docs/amazon-reference.md`) are adapted to the student marketplace without reproducing Amazon's branding. No extra features are invented.

## 1. Information architecture (global)

- **Header:** logo/wordmark → search bar (center) → account menu / wishlist / messages → "Sell" (create listing).
- **Footer:** minimal (about, terms placeholder, no Amazon branding).
- **Anonymous visitors:** can search, browse, view listings and seller profiles. Sign-in is required for saving, contacting, and selling.

## 2. Screens

### 2.1 Home / landing
- **Purpose:** entry point for discovery.
- **Entry points:** app root.
- **Layout:** search bar; category chips; recent/newest listings grid.
- **Data:** `GET /listings?sort=newest`, `GET /categories`.
- **Actions:** search, browse category, open listing.
- **Auth:** none.

### 2.2 Search results / category browse
- **Purpose:** filterable result list (adapted from Amazon's result page: left filter rail + result grid + sort + pagination).
- **Layout:** filter panel (category, price min/max, condition checkboxes), sort dropdown, result cards, pagination.
- **Data:** `GET /listings` with query params.
- **Result card:** cover image, title, price (INR), condition, category, seller display name.
- **Actions:** open detail, save (if signed in), apply/clear filters, change sort, paginate.
- **Auth:** save requires sign-in.

### 2.3 Listing detail
- **Purpose:** full item inspection (adapted from Amazon product detail: gallery + title + price + condition + description + seller).
- **Layout:** image gallery (thumbnails + main), title, price, condition badge, category, description, seller block ("View seller", "Contact seller"), "Save" and "Report" actions.
- **Data:** `GET /listings/{id}`, `GET /sellers/{seller_id}`.
- **Actions:** contact seller (starts conversation), save, report, view seller.
- **States:** sold/inactive/removed → "Unavailable"/"Sold" banner (owner or participant view); non-owner of non-active → 404 screen.

### 2.4 Seller profile
- **Purpose:** public seller info + active listings (adapted from Amazon seller/offer page but simplified: no ratings).
- **Layout:** display name, university (provisional), optional image/bio, active listings grid.
- **Data:** `GET /sellers/{seller_id}`, `GET /sellers/{seller_id}/listings`.
- **Privacy:** never shows email/phone/credentials.

### 2.5 Create listing
- **Purpose:** publish an item (adapted from Amazon "fill product info" flow: identity → description → images → offer).
- **Fields:** title, description, category (select), condition (select), price (INR), quantity, images (upload 0–5, ordered).
- **Behavior:** can save as draft; publish requires ≥1 image (proposed). Duplicate-submit prevention. Unsaved-change warning.
- **Data:** `POST /listings` → `POST /listings/{id}/images` → `POST /listings/{id}/publish`.

### 2.6 Edit listing
- **Purpose:** edit draft/active listings.
- **Fields:** same as create (partial allowed).
- **Data:** `PATCH /listings/{id}`, image upload/remove/reorder.
- **Guard:** `sold`/`removed` are read-only.

### 2.7 My listings
- **Purpose:** seller management hub (adapted from Amazon Seller Central inventory).
- **Layout:** table/list with status badge and per-row actions (edit, publish, deactivate, reactivate, mark sold, delete).
- **Data:** `GET /me/listings`.

### 2.8 Login / 2.9 Registration
- **Purpose:** authenticate / create account.
- **Fields:** login (email, password); registration (email, password, display name; university if enabled).
- **Errors:** inline validation; server `422`/`401`/`403` mapped to messages; rate-limit notice.

### 2.10 Account settings / profile
- **Purpose:** manage own profile.
- **Fields:** display name, bio, profile image.
- **Data:** `GET /me`, `PATCH /me`.

### 2.11 Wishlist
- **Purpose:** saved items.
- **Layout:** list of saved listings with status; "Unavailable" state for sold/inactive/removed.
- **Data:** `GET /wishlist`, `DELETE /wishlist/{listing_id}`.

### 2.12 Conversations list
- **Purpose:** my threads.
- **Layout:** list with counterpart + listing title + last message.
- **Data:** `GET /conversations`.

### 2.13 Conversation detail
- **Purpose:** thread view.
- **Layout:** message list (chronological), composer. Polling refresh.
- **Data:** `GET /conversations/{id}`, `GET .../messages`, `POST .../messages`.
- **States:** empty (no messages yet), send failure (retry, no loss), counterpart unavailable (suspended/deleted).

### 2.14 Admin moderation (if included)
- **Purpose:** review reports, moderate listings, suspend users.
- **Data:** `GET /admin/reports`, `POST /admin/reports/{id}/resolve`, `POST /admin/listings/{id}/moderate`, `POST /admin/users/{id}/suspend`.

### 2.15 Not-found / error
- **Purpose:** 404 and general error screens with clear messaging and a "back to marketplace" action.

## 3. UI states (applies to every data-dependent screen)

| State | Behavior |
|---|---|
| Initial | Server-rendered content where possible (SSR) |
| Loading | Skeleton loaders for cards/list; spinner for actions |
| Empty | Contextual empty state ("No listings match your filters") with clear action |
| Success | Rendered content |
| Validation error | Inline, field-level, on submit (and live where useful) |
| API error | Retryable banner with retry button; no partial-state corruption |
| Unauthorized | Redirect to login with return path |
| Forbidden | Explicit "not permitted" message |
| Not-found | 404 screen |
| Retry | Only for idempotent reads/actions; mutation retries gated by idempotency rules |

## 4. Form specification

- **Required:** title, category, condition, price (create); email, password (auth).
- **Constraints:** title 3–120; description ≤4000; price > 0; message body 1–2000; bio ≤500.
- **Validation timing:** on blur + on submit; server is authoritative.
- **Submit:** disable button while in-flight; block duplicate submits.
- **Unsaved changes:** confirm before navigating away on create/edit forms.

## 5. Visual specification (restrained design system)

Derived from accessibility requirements and general marketplace conventions (not Amazon's branding).

- **Typography:** one sans-serif family; type scale 14/16/20/24/32 px; clear heading hierarchy.
- **Spacing:** 4px base grid; consistent gutters.
- **Layout width:** content max-width ~1200px; centered.
- **Breakpoints:** 320–639 (mobile), 640–1023 (tablet), ≥1024 (desktop).
- **Forms:** labeled inputs, visible borders, helper text, inline errors.
- **Buttons:** primary (filled), secondary (outlined), destructive (red, with confirm for delete/sold).
- **Inputs:** text, textarea, select, number; explicit labels; error styling.
- **Listing cards:** image, title (clamped), price, condition badge, category, seller.
- **Image gallery:** main image + thumbnail strip, keyboard-navigable.
- **Navigation:** persistent header, breadcrumb on detail.
- **Dialogs:** accessible (focus trap, Esc to close, labelled).
- **Notifications/toasts:** used sparingly for confirmations (e.g., "Saved to wishlist"), with `role="status"`.
- **Focus indicators:** visible 2px outline on all focusables.
- **Loading indicators:** skeletons + spinners with `aria-busy`.

## 6. Accessibility (WCAG 2.2 AA)

- Keyboard navigation for all interactive flows.
- Visible focus everywhere.
- Programmatic form labels + error identification (`aria-describedby`, `aria-invalid`).
- Contrast ≥ 4.5:1 for text (3:1 for large text/UI).
- Image `alt` text (listing images, profile images).
- Semantic HTML (landmarks, headings, lists, `button`/`a` correctness).
- Dialog focus management (focus trap, restore focus on close).
- Accessible status announcements (`role="status"`/`aria-live`) for async results.
- Enforced by axe-core in E2E (NFR-ACC-001).

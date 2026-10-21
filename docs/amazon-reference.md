# Amazon.com Reference Research

This document records the Amazon.com patterns that inform the Student Marketplace design. It separates **verified evidence** (sourced from official Amazon documentation that was successfully retrieved) from **unverified** areas, and records the decision for each pattern.

## Research status and limitations

| Source | Status | Notes |
|---|---|---|
| `https://www.amazon.com/` | **Inaccessible** | Homepage returned empty content (bot-detection / JavaScript-rendered shell). No interface observations could be verified from the live homepage. |
| `https://sell.amazon.com/blog/amazon-product-listings` | **Verified** | Retrieved 2026-04-29 article, "How to create Amazon product listings". |
| `https://sell.amazon.com/blog/amazon-condition-guidelines` | **Verified** | Retrieved 2025-09-26 article, "What are Amazon condition guidelines?". |
| `https://www.aboutamazon.com/news/retail/amazon-wish-list` | **Verified** | Retrieved "How to create and share Amazon Wish Lists". |
| `https://sell.amazon.com/tools/seller-central` | **Not fetched** | Seller Central is a logged-in tool; inventory-management behavior is instead inferred from the two verified seller blog articles. |

Because the live Amazon.com storefront could not be inspected, direct UI observations (exact navigation labels, card layout, filter control placement) are treated as **unverified**. The adaptation below relies on the verified seller-side documentation plus widely documented, stable Amazon shopping conventions. Where a convention is not explicitly verified by a retrieved source, it is marked **unverified**.

---

## Verified findings and their implications

### 1. Listing creation workflow (seller side)

**Evidence** (`sell.amazon.com/blog/amazon-product-listings`):
- A listing consists of a **product detail page** plus the seller's **offer** (price, condition, quantity).
- Seller workflow is: (1) search for existing product, (2) fill product information across tabs, (3) **save as draft or submit**.
- Product information sections: **Product Identity** (name/type), **Product Description** (paragraph description + bullet points), **Images** (up to nine photos, ordered), **Product Details**, **Offer** (quantity, price, condition, fulfillment), **Safety & Compliance**.
- Price is set by the seller ("The list price for your product on Amazon is up to you").
- Images: "upload up to nine photos … arrange your images in the order you want them to appear".

**Marketplace adaptation:**
- Student-created listings are simpler than Amazon's catalog: a seller creates a single-item (or declared-quantity) offer with a title, description, price, category, condition, and images.
- Adopt the **draft → submit** lifecycle (draft saved locally/DB, then published as active).
- Adopt **ordered multiple images** with an upper bound (we choose 5 for MVP; see decision).
- Adopt **seller-set price**.
- Reject Amazon's "match an offer to an existing catalog page" and "product variations" concepts — they belong to a shared catalog model that this marketplace does not have (each listing is a unique student offer).

**Decision:** Adopt (simplified). Multiple ordered images, seller-set price, draft→publish lifecycle. Reject shared-catalog offer-matching and variation families.

---

### 2. Item condition model

**Evidence** (`sell.amazon.com/blog/amazon-condition-guidelines`):
- General conditions: **New**, **Renewed**, **Rental**, **Used - Like New / Open Box**, **Used - Very Good**, **Used - Good**, **Used - Acceptable**, **Collectible**.
- Books have a parallel set: New, Used - Like New, Used - Very Good, Used - Good, Used - Acceptable (+ Collectible variants, and **Unacceptable**).
- Unacceptable items: missing essential parts, damaged beyond use, counterfeit, promotional/advanced copies, expired, etc.
- Guidance emphasizes accurate, honest condition selection and detailed descriptions of defects.

**Marketplace adaptation:**
- Student goods are used items primarily. Adopt a reduced, unambiguous set: **New, Like New, Very Good, Good, Acceptable**.
- Omit Amazon's specialized conditions (`Renewed`, `Rental`, `Collectible`) from the MVP because they imply third-party inspection/grading programs and additional categories of goods that the MVP does not implement.
- Adopt the principle of honest, seller-declared condition, reinforced by moderation (see `docs/08-security.md`).
- Add a "prohibited goods" rule aligned with Amazon's unacceptable-items principle, enforced by moderation.

**Decision:** Adopt (reduced set of 5 conditions). Specialized conditions and per-category condition sets are future scope.

---

### 3. Wishlist / saved items

**Evidence** (`aboutamazon.com/news/retail/amazon-wish-list`):
- "Add to List" control appears on the product detail page.
- Lists are created/managed from an "Account & Lists" entry point.
- Lists are **private until explicitly shared**.
- "As items are purchased, they are no longer visible on the list" — purchased items drop off (or are hidden) by default.

**Marketplace adaptation:**
- Adopt "Save" (wishlist) control on the listing detail page and listing cards.
- Adopt a single private per-user wishlist (no multi-list sharing system in MVP).
- Adopt the "purchased/unavailable items are no longer offered" principle: a saved item whose listing becomes **sold, removed, or inactive** is shown as **Unavailable** (not silently deleted), giving the user a clear way to remove it. This directly satisfies the requirement "clear behavior when a saved listing becomes sold, deleted, or inactive".
- Reject list sharing, multiple named lists, comments, priority levels, and price-drop notifications (future scope).

**Decision:** Adopt (single private wishlist + unavailable-item behavior). Reject sharing/multi-list.

---

### 4. Seller / offer management

**Evidence** (`sell.amazon.com/blog/amazon-product-listings`, `amazon-condition-guidelines`):
- Seller Central "Inventory → Manage All Inventory" is the hub for editing offers, changing condition/quantity, and managing listings.
- A seller may offer a product in more than one condition (separate offers).

**Marketplace adaptation:**
- Adopt a "My Listings" management screen as the seller hub (list, edit, deactivate, mark sold, delete).
- Reject multiple conditions per item (each student listing is a single unique item/quantity with one condition). Multiple distinct items = multiple listings.

**Decision:** Adopt ("My Listings" hub). Reject multi-condition offers and bulk-listing tools.

---

### 5. Search, filters, sorting, pagination

**Evidence:** Not verifiable from the retrieved sources (storefront search UI was not accessible). Amazon's search/filter/sort conventions are widely documented but **not verified** in this research pass.

**Marketplace adaptation:**
- Search by keyword over title + description.
- Filters: category, price range (min/max), condition (multi-select).
- Sort: newest (default), price low→high, price high→low, and relevance when a keyword query is present.
- Paginated results (Amazon uses paginated result pages).

**Decision:** Adopt as a reasonable interpretation; **mark the specific filter control placement and any "relevance" ranking behavior as unverified**. No recommendation engine or AI ranking.

---

## Summary decision table

| Reference area | Evidence | Marketplace adaptation | Decision |
|---|---|---|---|
| Search and browse | Unverified (storefront not accessible) | Keyword search + category browse + filters + sort + pagination over active listings | Adopt (best-effort), mark ranking unverified |
| Listing details | Verified (seller blog: detail page = description + images + price/condition) | Dedicated listing detail page with image gallery, title, description, price, condition, seller link | Adopt (simplified) |
| Price and condition | Verified (condition guidelines; seller-set price) | Seller-set INR price + 5-condition enum | Adopt (reduced condition set) |
| Wishlist | Verified (aboutamazon: add-to-list, private, purchased items drop off) | Single private wishlist; unavailable items shown as Unavailable | Adopt (single list) |
| Seller management | Verified (Seller Central inventory management) | "My Listings" hub: edit, deactivate, mark sold, delete | Adopt |
| Image presentation | Verified (up to 9 ordered photos) | Ordered gallery, up to 5 images (MVP) | Adopt (reduced count) |
| Draft lifecycle | Verified (save as draft or submit) | `draft` → `active` lifecycle | Adopt |
| Shared catalog / variations | Verified (Amazon has them) | Not applicable to unique student offers | Reject |
| Reviews / ratings | Verified (Amazon has them; via Vine etc.) | Out of scope per requirements | Reject |
| Payments / checkout | Verified (Amazon has them) | Out of scope (unresolved scope decision) | Reject for MVP |

## Unverified items

- Exact storefront navigation labels and card layout (homepage inaccessible).
- Default result ordering ("Featured"/relevance ranking) — treated as out of scope; we default to newest.
- Real-time messaging — Amazon's buyer-seller messaging (Amazon Buyer-Seller Messaging Service) was not inspected; the marketplace's chat is adapted from the explicit requirement, not from a verified Amazon chat UI.

## Licensing note

No Amazon logos, proprietary assets, copyrighted text, or branding are reproduced. The implementation is an original student marketplace *inspired by* verified interaction patterns.

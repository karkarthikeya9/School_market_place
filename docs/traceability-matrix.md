# Traceability Matrix

Maps each approved functional requirement to its domain entities, API endpoints, UI screens, security controls, and tests. Status: `Planned` (blueprint only — no implementation yet).

| Requirement | Domain model | API | UI | Security | Tests | Status |
|---|---|---|---|---|---|---|
| FR-AUTH-001 Register | User, UserProfile | `POST /auth/register` | Registration | Argon2id, rate limit | Auth contract test | Planned |
| FR-AUTH-002 Login | User | `POST /auth/login` | Login | Argon2id, rate limit | Auth test | Planned |
| FR-AUTH-003 Logout | Session | `POST /auth/logout` | Header menu | Session invalidation | Auth test | Planned |
| FR-AUTH-004 Session | Session | (cookie) | App shell | httpOnly/Secure cookie | E2E persistence | Planned |
| FR-AUTH-005 Password storage | User | — | — | Argon2id | Unit test | Planned |
| FR-AUTH-006 Email verify | User | (register flow) | Registration | Confirmation token | Auth test | Planned (provisional) |
| FR-AUTH-007 Roles | User.role | (session) | — | RBAC | AuthZ test | Planned |
| FR-AUTH-008 Suspension | User.status | `POST /admin/users/{id}/suspend` | Admin | Admin-only | AuthZ test | Planned |
| FR-UNI-001 Affiliation | University, UserProfile | (register) | Registration/profile | — | Integration test | Planned (provisional) |
| FR-UNI-002 List universities | University | `GET /universities` | Registration | — | Contract test | Planned (provisional) |
| FR-PROF-001 Profile creation | UserProfile | (register) | — | — | Integration test | Planned |
| FR-PROF-002 View public profile | UserProfile | `GET /sellers/{id}` | Seller profile | DTO privacy | Contract test | Planned |
| FR-PROF-003 Edit own profile | UserProfile | `PATCH /me` | Account settings | Ownership | AuthZ test | Planned |
| FR-PROF-004 Privacy | UserProfile | all public | — | DTO whitelist | Contract test | Planned |
| FR-LIST-001 Create draft | Listing | `POST /listings` | Create listing | Ownership | Listing creation test | Planned |
| FR-LIST-002 Publish | Listing.status | `POST /listings/{id}/publish` | Create/My listings | Ownership | Listing test | Planned |
| FR-LIST-003 Edit | Listing | `PATCH /listings/{id}` | Edit listing | Ownership + version | Ownership/409 test | Planned |
| FR-LIST-004 Mark sold | Listing.status | `POST /listings/{id}/mark-sold` | My listings | Ownership | Sold-item test | Planned |
| FR-LIST-005 Deactivate | Listing.status | `POST /listings/{id}/deactivate` | My listings/admin | Owner/admin | Lifecycle test | Planned |
| FR-LIST-006 Reactivate | Listing.status | `POST /listings/{id}/reactivate` | My listings/admin | Owner/admin | Lifecycle test | Planned |
| FR-LIST-007 Delete | Listing.status | `DELETE /listings/{id}` | My listings/admin | Owner/admin | Lifecycle test | Planned |
| FR-LIST-008 Detail | Listing, Image | `GET /listings/{id}` | Listing detail | Visibility rule | Detail test | Planned |
| FR-LIST-009 Own listings | Listing | `GET /me/listings` | My listings | Ownership | Integration test | Planned |
| FR-LIST-010 Ownership | Listing.seller_id | (all mutations) | — | Ownership | Ownership test | Planned |
| FR-LIST-011 Quantity | Listing.quantity | (create/patch) | Create/Edit | — | Validation test | Planned |
| FR-LIST-012 Availability invariant | Listing.status | `GET /listings` | Search/browse | — | Search test | Planned |
| FR-IMG-001 Upload | ListingImage | `POST /listings/{id}/images` | Create/Edit | Signature/size validation | Image test | Planned |
| FR-IMG-002 Multiple/order | ListingImage.position | order endpoint | Gallery | — | Image test | Planned |
| FR-IMG-003 Remove | ListingImage | `DELETE .../images/{id}` | Edit | Ownership | Image test | Planned |
| FR-IMG-004 Safe rejection | ListingImage | upload | Create/Edit | Decode validation | Image test | Planned |
| FR-IMG-005 Storage access | ListingImage | (object storage) | — | Server-mediated write | Integration test | Planned |
| FR-CAT-001 List categories | Category | `GET /categories` | Home/browse | — | Contract test | Planned |
| FR-CAT-002 Assign | Listing.category_id | create/patch | Create/Edit | — | Validation test | Planned |
| FR-CAT-003 Condition enum | Listing.condition | create/patch | Create/Edit/filter | — | Validation test | Planned |
| FR-SEARCH-001 Keyword | Listing (FTS) | `GET /listings?q=` | Search | — | Search test | Planned |
| FR-SEARCH-002 Category filter | Listing, Category | `GET /listings?category_id=` | Filters | — | Search test | Planned |
| FR-SEARCH-003 Price range | Listing.price_minor | `GET /listings?min_price=&max_price=` | Filters | — | Search test | Planned |
| FR-SEARCH-004 Condition filter | Listing.condition | `GET /listings?condition=` | Filters | — | Search test | Planned |
| FR-SEARCH-005 Combine | — | combined params | Filters | — | Search test | Planned |
| FR-SEARCH-006 Sort | — | `sort` param | Sort dropdown | — | Search test | Planned |
| FR-SEARCH-007 Paginate | — | `page`/`page_size` | Pagination | — | Search test | Planned |
| FR-SEARCH-008 Active only | Listing.status | `GET /listings` | Search/browse | — | Search test | Planned |
| FR-SEARCH-009 Open listing | — | `GET /listings/{id}` | Result card link | — | E2E | Planned |
| FR-SELLER-001 Display name | UserProfile.display_name | `GET /sellers/{id}` | Seller profile | — | Contract test | Planned |
| FR-SELLER-002 University | University | seller profile | Seller profile | — | Contract test | Planned (provisional) |
| FR-SELLER-003 Profile image | UserProfile.profile_image_url | seller profile | Seller profile | — | Contract test | Planned |
| FR-SELLER-004 Active listings | Listing | `GET /sellers/{id}/listings` | Seller profile | — | Integration test | Planned |
| FR-SELLER-005 Listing→seller link | — | seller block | Listing detail | — | E2E | Planned |
| FR-CHAT-001 Initiate | Conversation | `POST /conversations` | Detail contact | No self-message | Chat test | Planned |
| FR-CHAT-002 Participants | Conversation | — | — | Participant-only | AuthZ test | Planned |
| FR-CHAT-003 Persist | Message | `POST .../messages` | Chat | — | Persistence test | Planned |
| FR-CHAT-004 History | Message | `GET .../messages` | Chat | Participant-only | Chat test | Planned |
| FR-CHAT-005 List | Conversation | `GET /conversations` | Conversations list | Ownership | Integration test | Planned |
| FR-CHAT-006 Authorization | Conversation | (all) | — | Participant-only | Privacy test | Planned |
| FR-CHAT-007 Validation | Message.body | `POST .../messages` | Composer | — | Validation test | Planned |
| FR-CHAT-008 Sold/inactive behavior | Conversation, Listing | (retention) | Chat | — | Integration test | Planned |
| FR-CHAT-009 Deleted/suspended | Conversation | (retention) | Chat | — | Integration test | Planned |
| FR-CHAT-010 No self-message | Conversation | `POST /conversations` | — | 422 self_message | Chat test | Planned |
| FR-CHAT-011 Polling | Message | `GET .../messages` | Chat | — | E2E | Planned |
| FR-WISH-001 Save | WishlistItem | `POST /wishlist` | Detail/card | Ownership | Wishlist test | Planned |
| FR-WISH-002 View | WishlistItem | `GET /wishlist` | Wishlist | Ownership | Wishlist test | Planned |
| FR-WISH-003 Remove | WishlistItem | `DELETE /wishlist/{id}` | Wishlist | Ownership | Wishlist test | Planned |
| FR-WISH-004 No duplicates | WishlistItem (unique) | `POST /wishlist` | — | — | Idempotency test | Planned |
| FR-WISH-005 Persist sessions | WishlistItem | `GET /wishlist` | Wishlist | — | E2E | Planned |
| FR-WISH-006 Unavailable behavior | WishlistItem + Listing.status | `GET /wishlist` | Wishlist | — | Wishlist test | Planned |
| FR-AVAIL-001 Sold invariant | Listing.status | mark-sold + search | — | — | Sold-item test | Planned |
| FR-MOD-001 Report | Report | `POST /reports` | Detail report | Signed-in | Report test | Planned |
| FR-MOD-002 List reports | Report | `GET /admin/reports` | Admin | Admin-only | AuthZ test | Planned |
| FR-MOD-003 Moderate | ModerationAction | `POST /admin/listings/{id}/moderate` | Admin | Admin-only | Admin test | Planned |
| FR-MOD-004 Record action | ModerationAction, AuditLog | (tx) | — | — | Admin test | Planned |
| FR-AUDIT-001 Audit log | AuditLog | (moderation/suspend) | — | — | Integration test | Planned |
| FR-AUDIT-002 Structured logs | — | (logging) | — | No secrets | Unit test | Planned |

## Non-functional traceability

| NFR | Verified by |
|---|---|
| NFR-PERF-* | k6 load tests on staging |
| NFR-SEC-* | Security tests + CI scans |
| NFR-REL-* | Restart smoke + transaction tests |
| NFR-AVAIL-001 | Health-check smoke test |
| NFR-SCAL-001 | Architecture review (stateless) |
| NFR-MAINT-* | CI typecheck + contract-drift check |
| NFR-ACC-* | axe-core + keyboard E2E |
| NFR-PRIV-* | Contract tests + review |
| NFR-OBS-001 | Log sampling |
| NFR-DATA-* | Migration + constraint tests |
| NFR-BROWSER-001 | E2E browser matrix |
| NFR-RESP-001 | Responsive viewport E2E |
| NFR-BACKUP-* | Provider config + restore drill |

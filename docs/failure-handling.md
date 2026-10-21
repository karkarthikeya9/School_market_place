# Failure Handling

Defines detection, user-visible behavior, logging, retry, idempotency, transaction behavior, recovery, and tests for each failure class. Retries are used only where safe; invalid requests, authorization failures, and non-idempotent mutations are **not** blindly retried. No dead-letter queue (no async processing exists).

| Failure | Detection | User-visible | Logging | Retry | Idempotency / TX | Recovery | Test |
|---|---|---|---|---|---|---|---|
| Database unavailable | Connection error | 500 banner "service unavailable, try again" | ERROR (no secrets) | Backoff for idempotent reads only | N/A | Connection pool reconnects | Integration test with dropped DB |
| API failure (unexpected) | Exception in controller | 500 error envelope | ERROR + trace id | None automatic | N/A | Central handler | Unit test of error mapper |
| Image upload fails | Upload/storage error | Inline upload error; listing stays intact | WARN | User retries manually | No partial listing; image row written only after successful store | Delete any orphan object | FR-IMG-004 test |
| Image storage unavailable | Storage error | Upload error; existing images still served via CDN cache | ERROR | User retries | Same as above | Service restored | Integration test |
| DB transaction fails | `$transaction` throws | 500; no partial state | ERROR | None | Full rollback | Consistent state | Transaction rollback test |
| Duplicate request (e.g., double submit) | Client-side disable + idempotency where defined | Blocked/prevented; wishlist/conversation idempotent | INFO | N/A | Idempotent endpoints (wishlist, conversation) | — | Double-submit E2E |
| Listing changes while viewing | Version/stale data | 409 CONFLICT with "listing changed, refresh" | INFO | N/A | Optimistic concurrency (`version`) | User refreshes | PATCH stale-version test |
| Two updates conflict | Version mismatch / lost update | 409 | INFO | N/A | Optimistic concurrency | User refreshes | Concurrency test |
| Auth lost mid-operation | 401 from endpoint | Redirect to login, preserve intent | INFO | N/A | N/A | Re-authenticate | E2E session-expiry |
| Unauthorized operation | AuthZ check fails | 403 (or 404 to avoid existence leak) | WARN (possible abuse) | None | N/A | N/A | Ownership/IDOR tests |
| Message send fails | API error | Composer shows failure; draft preserved for retry | WARN | Manual (safe — message send is idempotent-by-nature but not auto-retried) | Single insert | User retries | Message failure E2E |
| Browser disconnects | Network error | Error toast; re-fetch on reconnect | N/A | Manual refresh | N/A | Reload | E2E network-off |
| Request times out | Timeout | Timeout error; no auto-retry of mutations | WARN | Manual | N/A | User retries | Timeout test |
| Third-party service down | Provider error (email/object storage) | Graceful degradation (e.g., upload unavailable) | ERROR | Manual/backoff for reads | N/A | Restore service | Mocked provider failure |
| Deployment migration fails | Migrate error in CI/deploy | Deploy aborted; previous version stays live | ERROR | Re-run after fix | Migrations transactional where supported | Rollback to previous deployment | CI migration failure test |

## Rules

- **Retry policy:** automatic retries only for idempotent reads and safe, idempotent operations (with bounded backoff). Never auto-retry login, registration (non-idempotent), or any mutation whose retry could double-apply.
- **Idempotency:** `POST /wishlist` and `POST /conversations` are idempotent by design (unique constraints); all other mutations rely on client duplicate-submit prevention and optimistic concurrency.
- **Transaction boundaries:** every multi-write state change is wrapped in a single transaction (create listing+images, mark-sold, moderate+audit, send+bump).
- **Rollback:** DB transactions roll back atomically; deployment rollback is via previous immutable release.
- **Recovery:** user-facing retry affordances on safe operations; automatic reconnection for the DB pool.

# Repository Structure

A single Next.js application (modular monolith). Layout chosen after selecting the stack (DEC-001/DEC-002).

```
project/
├── frontend/                 # UI: pages, components, api client, forms
│   ├── app/                  # App Router pages + layouts
│   ├── components/           # Reusable UI components
│   ├── lib/                  # API client, hooks, utils
│   └── ...
├── backend/                  # API + domain logic (route handlers + services)
│   ├── app/api/v1/           # Route handlers (controllers) per endpoint family
│   ├── modules/              # Feature modules: auth, listings, chat, wishlist, ...
│   │   └── <module>/
│   │       ├── service.ts    # Business logic
│   │       ├── validation.ts # Zod schemas
│   │       └── repository.ts # Prisma access
│   ├── lib/                  # db client, auth, errors, logging, rate-limit
│   └── middleware.ts         # Auth/session middleware
├── shared/                   # Shared Zod schemas + TS types (contract source)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/                    # E2E + integration (Playwright/Vitest)
│   ├── e2e/
│   └── integration/
├── scripts/
│   ├── seed-admin.mjs
│   └── ...
├── docs/                     # This blueprint + openapi.yaml
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── vitest.config.ts
└── README.md
```

**Notes:**
- `backend/` and `frontend/` are one application (not two deployables). The split is a logical boundary: the frontend only imports from `shared/` and the API client; the backend only imports from `shared/` and Prisma. This prevents the frontend from reaching into DB code and vice-versa.
- `shared/` holds the Zod schemas + inferred TS types that both sides consume; it is the single source of truth mirroring `docs/openapi.yaml`.
- Tests co-located where practical (`*.test.ts` next to units) plus top-level `tests/` for E2E/integration.

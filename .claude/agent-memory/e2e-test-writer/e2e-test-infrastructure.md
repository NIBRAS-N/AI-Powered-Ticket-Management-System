---
name: e2e-test-infrastructure
description: Playwright E2E test setup — config, ports, database, global setup/teardown, module resolution
metadata:
  type: project
---

E2E tests use a separate test database (`ticket_system_test`) with backend on port 3001, frontend on port 5174.

**Why:** Isolation from dev database and dev servers prevents interference.

**How to apply:**
- Base URL is `http://localhost:5174`, configured in `playwright.config.ts` at project root
- `backend/.env.test` has all test env vars (DATABASE_URL, PORT=3001, CORS_ORIGIN=http://localhost:5174)
- `frontend/vite.config.ts` uses `mode === "test"` to set port 5174 and proxy `/api` to port 3001
- Global setup (`e2e/global-setup.ts`) runs `prisma migrate deploy` then `tsx prisma/seed.ts` from backend dir
- Global teardown (`e2e/global-teardown.ts`) runs `prisma migrate reset --force` to clean up
- Seed only creates admin user: admin@example.com / password123 (name: "System Admin", role: ADMIN)
- Root `node_modules` only has `@playwright/test`, `concurrently`, `dotenv-cli`, `typescript`
- `better-auth` and Prisma are only in `backend/node_modules` — scripts needing them must set `NODE_PATH` or run from backend dir
- `bunx` resolves workspace packages across workspaces (used for dotenv and tsx)
- Root tsconfig: `module: ESNext`, `moduleResolution: bundler`
- Playwright handles `__dirname` in test files (CJS compat), but standalone scripts run via `tsx` need ESM-safe `__dirname` via `import.meta.url`

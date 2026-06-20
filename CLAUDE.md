# AI-Powered Ticket Management System

## Project Overview

A full-stack AI-powered ticket management system for customer support operations. Incoming support emails become tickets, AI classifies and summarizes them, and agents manage tickets through a dashboard with AI-assisted tools.

## Tech Stack

- **Runtime**: Bun 1.3.x
- **Backend**: Express 5 + TypeScript, session-based auth
- **Frontend**: React 19 + Vite 6 + TypeScript, Tailwind CSS v4, React Router v7, TanStack Query v5, Axios
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Claude API (Anthropic SDK) for classification, summaries, suggested replies
- **Email**: SendGrid/Mailgun for inbound/outbound
- **E2E Testing**: Playwright (Chromium, separate test database)

## Project Structure

Monorepo with Bun workspaces:

```
/backend    → Express API (port 3000)
/frontend   → React SPA via Vite (port 5173, proxies /api → backend)
/e2e        → Playwright E2E tests
```

## Key Commands

```bash
bun install            # Install all workspace deps
bun run dev            # Run both backend + frontend concurrently
bun run dev:backend    # Backend only (tsx watch)
bun run dev:frontend   # Frontend only (vite)

# Backend database commands (run from /backend)
bun run db:generate    # Generate Prisma client
bun run db:migrate     # Run Prisma migrations
bun run db:seed        # Seed admin + agent accounts + KB articles
bun run db:studio      # Open Prisma Studio

# E2E testing (run from root)
bun run test:e2e       # Run Playwright E2E tests
bun run test:e2e:ui    # Open Playwright UI mode
bun run test:e2e:headed # Run tests in headed browser
bun run test:db:setup  # Migrate + seed test database
bun run test:db:reset  # Reset test database
```

## Documentation — Use context7

All library documentation must be fetched from context7 MCP server before writing code that depends on a library. Do NOT rely on training data for API syntax, configuration, or patterns — always query context7 for up-to-date docs. This applies to all dependencies: Express, Prisma, React, Tailwind, React Router, TanStack Query, Axios, Anthropic SDK, etc.

## Implementation Plan

Follow `implementation-plan.md` for phased build order. Reference `mvp.md` for feature requirements and `tech-stack.md` for architecture decisions.

## Authentication

- **Library**: `better-auth` (backend) + `better-auth/react` (frontend)
- Frontend auth client at `frontend/src/lib/auth-client.ts` using `createAuthClient()`
- `authClient.useSession()` → `{ data: session, isPending }` for session state
- `authClient.signIn.email({ email, password })` for login
- `AuthProvider` context at `frontend/src/context/AuthContext.tsx` wraps the app
- `ProtectedRoute` component guards authenticated routes
- `AdminRoute` component guards admin-only routes (checks `user.role === "ADMIN"`)
- Roles: `ADMIN`, `AGENT` (enum at `backend/src/constants/role.ts`)
- Session-based auth via HTTP-only cookies (not JWT)

## UI Components — shadcn/ui

- **Setup**: shadcn/ui with `new-york` style, `neutral` base color, Tailwind CSS v4
- **Path alias**: `@/*` → `./src/*` (configured in `tsconfig.json` + `vite.config.ts`)
- **Utility**: `cn()` helper at `frontend/src/lib/utils.ts` (clsx + tailwind-merge)
- **Config**: `frontend/components.json` (rsc: false, cssVariables: true, lucide icons)
- **Add components**: `bunx shadcn@latest add <component> --yes` from `/frontend`
- **Installed**: button, card, input, label
- Use shadcn theme tokens (`bg-background`, `text-destructive`, etc.) instead of raw Tailwind colors
- Forms use `react-hook-form` + `zod` + shadcn `Input`/`Label`/`Button` with `aria-invalid` for error states

## Conventions

- Backend env config lives in `backend/src/config/env.ts`
- Prisma client singleton at `backend/src/utils/prisma.ts`
- Frontend API client at `frontend/src/services/api.ts` (Axios with credentials + 401 interceptor)
- Shared TypeScript types at `frontend/src/types/index.ts`
- All API routes are prefixed with `/api`
- Session auth via HTTP-only cookies
- Seed admin credentials: `admin@example.com` / `admin123` (via env vars `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Seed agent credentials: `agent@example.com` / `password123`
- Admin-only pages (e.g. `/users`) use `AdminRoute` guard; navbar links conditionally render by role
- Rate limiting (`express-rate-limit`) is enabled only in production (`NODE_ENV=production`)

## E2E Testing — Playwright

- **Test database**: `ticket_system_test` (separate from dev `ticket_system`)
- **Test ports**: backend on 3001, frontend on 5174 (Vite `--mode test`)
- **Env config**: `backend/.env.test` loaded via `dotenv-cli`
- **Global setup**: runs Prisma migrations + seed against test DB before tests
- **Global teardown**: resets test DB after tests
- **Test directory**: `/e2e` — all E2E test files go here
- Vite config is mode-aware: `--mode test` switches proxy target to port 3001 and serves on 5174

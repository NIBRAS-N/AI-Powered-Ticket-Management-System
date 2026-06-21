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

# Component tests (run from root or /frontend)
bun run test               # Run Vitest component tests
bun run test:watch          # Vitest watch mode (from /frontend)

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
- **Installed**: alert-dialog, button, card, dialog, input, label, table, badge, skeleton
- Use shadcn theme tokens (`bg-background`, `text-destructive`, etc.) instead of raw Tailwind colors
- Forms use `react-hook-form` + `zod` + shadcn `Input`/`Label`/`Button` with `aria-invalid` for error states

## Conventions

- Backend uses Express 5 — async route handlers don't need `try/catch` + `next(error)`, rejected promises are forwarded to the error handler automatically
- Backend request validation uses `zod` — define a schema, call `safeParse(req.body)`, return first issue message on failure
- Backend env config lives in `backend/src/config/env.ts`
- Prisma client singleton at `backend/src/utils/prisma.ts`
- Frontend API client at `frontend/src/services/api.ts` (Axios with credentials + 401 interceptor)
- Frontend data fetching uses `useQuery` + `api.get()`, mutations use `useMutation` + `api.post()`/`api.put()`/`api.delete()` with `queryClient.invalidateQueries()` on success
- Shared TypeScript types at `frontend/src/types/index.ts`
- All API routes are prefixed with `/api`
- Session auth via HTTP-only cookies
- Seed admin credentials: `admin@example.com` / `admin123` (via env vars `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Seed agent credentials: `agent@example.com` / `password123`
- Admin-only pages (e.g. `/users`) use `AdminRoute` guard; navbar links conditionally render by role
- Rate limiting (`express-rate-limit`) is enabled only in production (`NODE_ENV=production`)

## Features

### User Management (Admin-only)
- **Backend**: `backend/src/routes/users.ts`, protected by `requireAuth` + `requireAdmin`
  - `GET /api/users` — paginated user list (`?page=1&limit=10`)
  - `POST /api/users` — create new user (`{ name, email, password }`, validated with zod), uses `adminAuth.api.signUpEmail()` for password hashing
  - `PATCH /api/users/:id` — update user (`{ name, email, password? }`), password optional (only updated when provided), uses `hashPassword` from `better-auth/crypto`
  - `DELETE /api/users/:id` — soft-delete (sets `isActive = false`, deletes all sessions); returns 403 for admin users
- **Frontend**: `frontend/src/pages/UsersPage.tsx` — paginated table (Name, Email, Role, Status, Joined) using TanStack Query
- **User Form Dialog**: `frontend/src/components/UserFormDialog.tsx` — unified create/edit modal (`user="new"` for create, `user={User}` for edit), password required on create, optional on edit
- **Delete User**: `frontend/src/components/DeleteUserDialog.tsx` — AlertDialog confirmation, hidden for admin rows, soft-deletes via `api.delete`
- GET endpoint filters by `isActive: true` — soft-deleted users are hidden from the list
- Route `/users` is guarded by `AdminRoute`; navbar "Users" link renders only for admins
- Response shape follows `PaginatedResponse<User>` from `frontend/src/types/index.ts`

### Layout
- `AppLayout` (`frontend/src/components/AppLayout.tsx`) wraps all authenticated pages with `Navbar` + a `<main>` container matching the navbar's `max-w-7xl` responsive padding

## Component Testing — Vitest + React Testing Library

- **Stack**: Vitest 4 + React Testing Library + happy-dom
- **Config**: Vitest is configured in `frontend/vite.config.ts` (`test` block), setup file at `frontend/src/test/setup.ts`
- **Test files**: Co-located with components/pages as `*.test.tsx` (e.g. `UsersPage.test.tsx`)
- **Render helper**: Use `renderWithQuery()` from `@/test/render` — wraps components in `QueryClientProvider` with retry disabled
- **API mocking**: Mock `@/services/api` with `vi.mock()` and `vi.mocked(api)` to control Axios responses
- **Run tests**: `bun run test` (from root or `/frontend`), `bun run test:watch` (from `/frontend`) for watch mode
- **Conventions**:
  - Test loading/skeleton states, success rendering, error states, and user interactions
  - Use `screen.findByText()` for async queries after API resolution
  - Use `within(row)` for scoping assertions to specific table rows
  - Call `vi.clearAllMocks()` in `afterEach`

### Ticket & Message Models
- **Database**: `Ticket` and `Message` models in `backend/prisma/schema.prisma`
  - Ticket: auto-increment `id`, `subject`, `description`, `senderEmail`, `senderName`, `status` (OPEN/RESOLVED/CLOSED), `category` (GENERAL/TECHNICAL/REFUND, nullable), optional `assignee` (User relation), `messages` relation
  - Message: auto-increment `id`, belongs to Ticket (cascade delete), `senderType` (STUDENT/AGENT), `senderName`, `content`
  - Enums: `TicketStatus`, `TicketCategory`, `SenderType`
- **Frontend types**: `Ticket`, `Message`, `TicketStatus`, `TicketCategory`, `SenderType`, `KnowledgeBaseArticle`, `DashboardStats` at `frontend/src/types/index.ts`

### Inbound Email Webhook
- **Route**: `POST /api/webhooks/inbound-email` (`backend/src/routes/webhooks.ts`) — public endpoint, protected by `requireWebhookSecret` middleware
- **Webhook auth**: `backend/src/middleware/require-webhook-secret.ts` — validates `x-webhook-secret` header against `WEBHOOK_AUTH_TOKEN` env var; returns 500 if env var not configured (fail-closed), 401 if header missing, 403 if invalid
- **Email parser**: `backend/src/services/email-parser.service.ts`
  - `inboundEmailSchema` — zod schema validating SendGrid inbound parse payload (`from`, `to`, `subject`, `text`, optional `envelope`)
  - `parseInboundEmail()` — extracts sender name/email, strips Re:/Fwd: prefixes, detects ticket references via `support+<id>@` plus-addressing or `[Ticket #<id>]` in subject
- **Ticket service**: `backend/src/services/ticket.service.ts`
  - `createTicketFromEmail()` — creates ticket with initial message in one Prisma call
  - `addMessageToTicket()` — adds message to existing ticket; reopens RESOLVED tickets when student replies; rejects messages on CLOSED tickets; uses `$transaction`
  - `findTicketById()` — simple lookup by ID
  - `isDuplicate()` — deduplication check: matches sender + subject + body within a 5-minute window against both tickets and messages
- **Flow**: Inbound email → validate `x-webhook-secret` header → parse & validate payload → check duplicate → thread onto existing ticket (if referenced and sender matches) → or create new ticket
- **Env**: `WEBHOOK_AUTH_TOKEN` (required) in `backend/src/config/env.ts` — must be set or webhook returns 500

## E2E Testing — Playwright

E2E tests use a separate `ticket_system_test` database with isolated ports (backend 3001, frontend 5174). **Always use the `e2e-test-writer` agent to write E2E tests** — do not write Playwright tests directly. The agent has full testing instructions, patterns, and project-specific configuration (`.claude/agents/e2e-test-writer.md`).

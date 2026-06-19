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

## Project Structure

Monorepo with Bun workspaces:

```
/backend    → Express API (port 3000)
/frontend   → React SPA via Vite (port 5173, proxies /api → backend)
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
bun run db:seed        # Seed admin account + KB articles
bun run db:studio      # Open Prisma Studio
```

## Documentation — Use context7

All library documentation must be fetched from context7 MCP server before writing code that depends on a library. Do NOT rely on training data for API syntax, configuration, or patterns — always query context7 for up-to-date docs. This applies to all dependencies: Express, Prisma, React, Tailwind, React Router, TanStack Query, Axios, Anthropic SDK, etc.

## Implementation Plan

Follow `implementation-plan.md` for phased build order. Reference `mvp.md` for feature requirements and `tech-stack.md` for architecture decisions.

## Conventions

- Backend env config lives in `backend/src/config/env.ts`
- Prisma client singleton at `backend/src/utils/prisma.ts`
- Frontend API client at `frontend/src/services/api.ts` (Axios with credentials + 401 interceptor)
- Shared TypeScript types at `frontend/src/types/index.ts`
- All API routes are prefixed with `/api`
- Session auth via HTTP-only cookies
- Seed admin credentials: `admin@ticketsystem.com` / `admin123`

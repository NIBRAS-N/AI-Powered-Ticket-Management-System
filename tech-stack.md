# Tech Stack & Build Procedure

## Stack

### Frontend

- **React 18 + TypeScript** — Widely adopted, strong ecosystem for building dashboards and data-heavy UIs.
- **Tailwind CSS** — Utility-first CSS framework for rapid, consistent styling.
- **React Router v6** — Client-side routing and navigation.
- **React Query (TanStack Query)** — Server state management with built-in polling and refetching, ideal for a live ticket dashboard.
- **Axios** — HTTP client for API communication.

### Backend

- **Node.js + Express + TypeScript** — Fast, lightweight API server with full type safety.
- **Database Sessions** — Server-side session storage in PostgreSQL for secure, revocable authentication. Sessions are tracked in a dedicated table, enabling easy invalidation and admin control over active sessions.

### Database

- **PostgreSQL** — Relational database for tickets, users, messages, and knowledge base articles.
- **Prisma ORM** — Type-safe database access, auto-generated client, and declarative schema migrations.

### AI

- **Claude API (Anthropic SDK)** — Powers ticket classification, conversation summaries, and suggested replies. Strong at following instructions and working with structured output.

### Email

- **SendGrid or Mailgun** — For sending outbound replies to students. Inbound email handled via webhooks (no IMAP polling needed).

### Deployment

- **Docker** — Containerized backend and frontend for consistent environments.
- **AWS** — Cloud hosting (ECS/Fargate for containers, RDS for PostgreSQL).

---

## Project Structure

Monorepo with two packages:

```
/backend    → Express API
/frontend   → React SPA
```

---

## Build Procedure

### Phase 1 — Foundation

1. Initialize monorepo, install tooling, configure TypeScript for both packages.
2. Set up PostgreSQL + Prisma schema (Users, Tickets, Messages, KnowledgeBase tables).
3. Build auth system — login endpoint, session middleware, seed the admin account.
4. Build user management API (admin CRUD for agents).

### Phase 2 — Core Ticket System

5. Build ticket CRUD API (create, list, get, update status, assign).
6. Build the frontend shell — layout, routing, auth pages, protected routes.
7. Build Ticket List View with search, filtering, sorting, pagination.
8. Build Ticket Detail View with conversation thread and reply editor.

### Phase 3 — Email Integration

9. Configure SendGrid/Mailgun for outbound email delivery.
10. Set up inbound email webhook endpoint — converts incoming emails to tickets.
11. Implement thread detection (reply to existing ticket vs. new ticket).
12. Implement duplicate detection (same sender, subject, body within a short window).

### Phase 4 — AI Features

13. AI ticket classification on creation (assign category via Claude API).
14. AI ticket summaries (generated when an agent opens a ticket).
15. AI suggested replies (2–3 options per ticket based on conversation context and knowledge base).
16. AI draft response from knowledge base (match relevant KB articles, generate grounded draft).

### Phase 5 — Dashboard & Polish

17. Build the Dashboard view (counts by status/category, recent tickets, unassigned).
18. Build User Management UI (admin panel for creating/editing/deactivating agents).
19. Error handling, loading states, toast notifications.
20. Dockerize backend and frontend, set up Docker Compose for local dev.
21. Testing and cleanup.

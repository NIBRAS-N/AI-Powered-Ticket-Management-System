# Implementation Plan

Derived from [mvp.md](mvp.md) and [tech-stack.md](tech-stack.md).

---

## Phase 1 — Project Setup & Database

Goal: Runnable backend and frontend skeletons with a fully migrated database.

### 1.1 Initialize Monorepo

- [ ] Create `/backend` and `/frontend` directories.
- [ ] Initialize `package.json` at the root (workspace config).
- [ ] Configure TypeScript (`tsconfig.json`) for both packages.
- [ ] Add shared scripts: `dev`, `build`, `lint`.
- [ ] Set up `.gitignore`, `.env.example` for both packages.

### 1.2 Backend Scaffold

- [ ] Initialize Express app with TypeScript.
- [ ] Set up project structure: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/utils`.
- [ ] Add environment config loader (dotenv).
- [ ] Add basic health-check endpoint (`GET /api/health`).
- [ ] Configure CORS middleware.

### 1.3 Database & Prisma Setup

- [ ] Install Prisma, initialize with PostgreSQL provider.
- [ ] Define Prisma schema:
  - `User` — id, name, email, passwordHash, role (ADMIN/AGENT), isActive, createdAt, updatedAt.
  - `Session` — id, userId, token, expiresAt, createdAt.
  - `Ticket` — id, subject, description, senderEmail, senderName, status (OPEN/RESOLVED/CLOSED), category (GENERAL/TECHNICAL/REFUND), assigneeId, createdAt, updatedAt.
  - `Message` — id, ticketId, senderType (STUDENT/AGENT), senderName, content, createdAt.
  - `KnowledgeBaseArticle` — id, title, content, category, createdAt, updatedAt.
- [ ] Run initial migration.
- [ ] Create seed script: insert default admin account and sample KB articles.

### 1.4 Frontend Scaffold

- [ ] Initialize React app with Vite + TypeScript.
- [ ] Install and configure Tailwind CSS.
- [ ] Install React Router v6, React Query, Axios.
- [ ] Set up project structure: `src/pages`, `src/components`, `src/hooks`, `src/services`, `src/types`.
- [ ] Create Axios instance with base URL and interceptors (attach session cookie, handle 401 redirects).

---

## Phase 2 — Authentication & User Management

Goal: Admin can log in, create agents, and manage accounts. Session-based auth protects all routes.

### 2.1 Auth — Backend

- [ ] Create `POST /api/auth/login` — validate email/password, create session row in DB, return session token via HTTP-only cookie.
- [ ] Create `POST /api/auth/logout` — delete session row, clear cookie.
- [ ] Create `GET /api/auth/me` — return current user from session.
- [ ] Build session middleware: read cookie, look up session in DB, attach user to request. Reject expired sessions.
- [ ] Hash passwords with bcrypt on user creation.

### 2.2 Auth — Frontend

- [ ] Build Login page — email/password form, error display.
- [ ] Create auth context/hook (`useAuth`) — stores current user, provides login/logout functions.
- [ ] Build `ProtectedRoute` wrapper — redirects unauthenticated users to login.
- [ ] Build `AdminRoute` wrapper — restricts access to admin-only pages.

### 2.3 User Management — Backend (Admin Only)

- [ ] Create `POST /api/users` — admin creates an agent (name, email, temporary password).
- [ ] Create `GET /api/users` — list all users with role and active status.
- [ ] Create `GET /api/users/:id` — get single user details.
- [ ] Create `PATCH /api/users/:id` — admin updates agent name or email.
- [ ] Create `PATCH /api/users/:id/deactivate` — deactivate agent, invalidate their active sessions.
- [ ] Add guard: cannot deactivate self or last admin.

### 2.4 User Management — Frontend (Admin Only)

- [ ] Build User List page — table with name, email, role, active/inactive status.
- [ ] Build Create Agent modal/form — name, email, temporary password fields.
- [ ] Build Edit Agent modal/form — update name or email.
- [ ] Add Deactivate button with confirmation dialog.

---

## Phase 3 — Core Ticket System (Backend)

Goal: Full ticket CRUD API with messages, status transitions, assignment, search, and filtering.

### 3.1 Ticket CRUD

- [ ] Create `POST /api/tickets` — create ticket (subject, description, senderEmail, senderName). Status defaults to OPEN.
- [ ] Create `GET /api/tickets` — list tickets with query params:
  - `search` — full-text search across subject, description, senderEmail.
  - `status` — filter by one or more statuses.
  - `category` — filter by one or more categories.
  - `assigneeId` — filter by agent or "unassigned".
  - `dateFrom`, `dateTo` — filter by creation date range.
  - `sortBy`, `sortOrder` — column + asc/desc.
  - `page`, `limit` — pagination.
- [ ] Create `GET /api/tickets/:id` — single ticket with all messages.
- [ ] Apply visibility rules: agents see own + unassigned tickets; admins see all.

### 3.2 Ticket Actions

- [ ] Create `PATCH /api/tickets/:id/status` — change status. Enforce transitions: OPEN → RESOLVED → CLOSED. No reopening CLOSED tickets.
- [ ] Create `PATCH /api/tickets/:id/assign` — assign/reassign ticket to an agent (admin only).
- [ ] Create `PATCH /api/tickets/:id/category` — manually override AI-assigned category.

### 3.3 Messages

- [ ] Create `POST /api/tickets/:id/messages` — agent sends a reply. Appends message to ticket, updates ticket's `updatedAt`.
- [ ] Create `GET /api/tickets/:id/messages` — list all messages for a ticket, chronological order.

### 3.4 Dashboard Stats

- [ ] Create `GET /api/dashboard` — returns:
  - Total ticket count.
  - Count by status (open, resolved, closed).
  - Count by category.
  - Recent tickets (last 10).
  - Unassigned open tickets.
- [ ] Apply same visibility rules (agent vs admin).

---

## Phase 4 — Core Ticket System (Frontend)

Goal: Agents and admins can view, search, filter, and manage tickets through the UI.

### 4.1 App Layout

- [ ] Build main layout: sidebar navigation + top bar with user info and logout.
- [ ] Sidebar links: Dashboard, Tickets, User Management (admin only).
- [ ] Set up React Router routes for all pages.

### 4.2 Dashboard Page

- [ ] Build summary cards: total tickets, open, resolved, closed.
- [ ] Build category breakdown (counts per category).
- [ ] Build recent tickets list (clickable rows → ticket detail).
- [ ] Build unassigned tickets section.
- [ ] Wire up React Query to `GET /api/dashboard` with auto-refetch.

### 4.3 Ticket List Page

- [ ] Build ticket table: columns for ID, Subject, Sender, Status, Category, Assignee, Created At.
- [ ] Build search bar (free-text, debounced).
- [ ] Build filter controls: status multi-select, category multi-select, assignee dropdown, date range picker.
- [ ] Build sort controls (click column headers).
- [ ] Build pagination controls.
- [ ] Wire up React Query to `GET /api/tickets` with all query params.

### 4.4 Ticket Detail Page

- [ ] Build ticket header: ID, subject, status badge, category badge, assignee, created date.
- [ ] Build conversation thread: chronological messages with sender, timestamp, content. Visually distinguish student vs agent messages.
- [ ] Build reply editor: text area + send button. On send, call `POST /api/tickets/:id/messages`.
- [ ] Build status controls: buttons to transition status (Open → Resolved → Closed).
- [ ] Build assignment control (admin only): dropdown to reassign to a different agent.
- [ ] Build category override control: dropdown to change category.

---

## Phase 5 — Email Integration

Goal: Inbound emails create tickets via webhook. Agent replies are sent back to students via email.

### 5.1 Inbound Email (Webhook)

- [ ] Choose and configure email provider (SendGrid or Mailgun) for inbound parsing.
- [ ] Create `POST /api/webhooks/inbound-email` — receives parsed email data from provider.
- [ ] Extract sender name, sender email, subject, and body from webhook payload.
- [ ] Thread detection: check if the email subject or headers reference an existing ticket ID. If yes, append as a new message to that ticket. If no, create a new ticket.
- [ ] Duplicate detection: reject if an identical email (same sender, subject, body) was received within the last 5 minutes.
- [ ] Secure the webhook endpoint (verify provider signature/token).

### 5.2 Outbound Email

- [ ] Configure email provider SDK (SendGrid/Mailgun) with API key.
- [ ] Create email sending service: accepts recipient, subject, body; sends via provider API.
- [ ] Hook into `POST /api/tickets/:id/messages` — when an agent sends a reply, also deliver it to the student's email.
- [ ] Include ticket reference ID in the email subject line (for thread detection on replies).

---

## Phase 6 — AI Features

Goal: Tickets are auto-classified, summarized, and agents receive AI-generated suggestions.

### 6.1 Claude API Integration

- [ ] Install Anthropic SDK.
- [ ] Create AI service module with shared config (API key, model, default params).
- [ ] Build prompt templates for each AI task (classification, summary, suggestions, draft response).
- [ ] Add error handling and rate limiting for API calls.

### 6.2 Ticket Classification

- [ ] On ticket creation, call Claude API with ticket subject + description.
- [ ] Prompt returns exactly one of: GENERAL, TECHNICAL, REFUND.
- [ ] Use structured output to enforce valid category values.
- [ ] Save classified category to the ticket.
- [ ] Create `GET /api/tickets/:id/classification` — returns AI-assigned category with confidence.

### 6.3 Ticket Summaries

- [ ] Create `GET /api/tickets/:id/summary` — generates a summary of the full conversation.
- [ ] Prompt includes all messages; output highlights: what the student wants, key details (order numbers, account info, errors), and current conversation state.
- [ ] Cache summary; regenerate when new messages are added (invalidate on new message).

### 6.4 Suggested Replies

- [ ] Create `GET /api/tickets/:id/suggestions` — returns 2–3 suggested replies.
- [ ] Prompt includes conversation history + relevant KB articles.
- [ ] Each suggestion has a different tone/approach: direct answer, request for more info, escalation.
- [ ] Regenerate when conversation changes.

### 6.5 Knowledge Base Draft Response

- [ ] Create `GET /api/tickets/:id/draft-response` — generates a draft grounded in KB articles.
- [ ] Search KB articles by keyword/category match against the ticket content.
- [ ] Pass matched articles as context to Claude API.
- [ ] Return the generated draft to the frontend.

### 6.6 AI Panel — Frontend

- [ ] Build AI sidebar/collapsible panel on the Ticket Detail page.
- [ ] Display AI summary (fetched on page load, refreshes on new messages).
- [ ] Display AI-assigned category with override dropdown.
- [ ] Display suggested replies — click to load into reply editor.
- [ ] Display draft response — click to load into reply editor.
- [ ] Add loading states and error handling for each AI section.

---

## Phase 7 — Polish & Deployment

Goal: Production-ready application with error handling, Docker setup, and AWS deployment.

### 7.1 Error Handling & UX

- [ ] Add global error boundary in React.
- [ ] Add toast notification system for success/error feedback.
- [ ] Add loading skeletons for all data-fetching views.
- [ ] Add empty states (no tickets, no results, etc.).
- [ ] Add form validation on all input forms (login, create agent, reply editor).
- [ ] Handle session expiry gracefully (redirect to login with message).

### 7.2 Security Hardening

- [ ] Rate-limit auth endpoints (login, webhook).
- [ ] Sanitize all user input (prevent XSS in ticket content and messages).
- [ ] Validate and sanitize webhook payloads.
- [ ] Ensure session cookies are HTTP-only, Secure, SameSite=Strict.
- [ ] Add CSRF protection.

### 7.3 Dockerization

- [ ] Create `Dockerfile` for backend (Node.js).
- [ ] Create `Dockerfile` for frontend (Nginx serving built React app).
- [ ] Create `docker-compose.yml` for local dev: backend, frontend, PostgreSQL.
- [ ] Add health checks to all containers.
- [ ] Document local setup instructions.

### 7.4 AWS Deployment

- [ ] Set up RDS PostgreSQL instance.
- [ ] Push Docker images to ECR.
- [ ] Deploy backend and frontend via ECS/Fargate.
- [ ] Configure environment variables and secrets.
- [ ] Set up HTTPS with a load balancer.
- [ ] Configure email provider webhook URL to point to production.

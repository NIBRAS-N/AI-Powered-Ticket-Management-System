---
name: webhook-testing-patterns
description: Patterns for API-level webhook e2e tests — no browser needed, uses request fixture with x-webhook-secret header
metadata:
  type: feedback
---

Webhook e2e tests use Playwright's `request` fixture for API-level testing (no browser). The `x-webhook-secret` header must match the `WEBHOOK_AUTH_TOKEN` env var in `backend/.env.test` (value: `test-webhook-secret-for-e2e`).

**Why:** The inbound email webhook has no UI — it's a server-to-server endpoint. API-level tests are faster and more direct.

**How to apply:** For API-only e2e tests, use `request.post()` / `request.get()` etc. with explicit headers. No need for `page` fixture. Use `Date.now()` in payloads to avoid cross-test duplicate detection collisions.

Key details discovered:
- Duplicate detection (`isDuplicate`) checks BOTH ticket-level (sender+subject+body) AND message-level (content+senderType+ticket.senderEmail). Message-level check ignores subject, so tests must vary the body text too — not just the subject.
- No ticket CRUD API routes exist yet. To manipulate ticket status for tests, use a Prisma helper script (`e2e/helpers/update-ticket-status.ts`) via `execSync`, following the same pattern as `create-agent-user.ts`.
- [[e2e-test-infrastructure]]

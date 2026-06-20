---
name: signup-disabled
description: HTTP sign-up endpoint is disabled in better-auth config — agent users must be created server-side
metadata:
  type: project
---

The better-auth config at `backend/src/lib/auth.ts` has `emailAndPassword.disableSignUp: true`.

**Why:** Sign-up is an admin-controlled operation; public sign-up is not allowed in this app.

**How to apply:**
- `POST /api/auth/sign-up/email` will reject requests — cannot create users via HTTP API
- To create test users (e.g., agent role), use better-auth's internal server-side API: `seedAuth.api.signUpEmail({ body: { name, email, password } })`
- This is the same pattern used in `backend/prisma/seed.ts`
- Default role for new users is "AGENT" (from schema default and `backend/src/lib/auth.ts` user.additionalFields.role.defaultValue)
- Helper script `e2e/helpers/create-agent-user.ts` implements this pattern for E2E tests
- The script must run with `NODE_PATH=backend/node_modules` and `cwd: backend/` to resolve `better-auth` imports

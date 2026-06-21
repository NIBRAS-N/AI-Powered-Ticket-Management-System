import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

/**
 * Inbound Email Webhook E2E Tests
 *
 * Tests the POST /api/webhooks/inbound-email endpoint which receives
 * parsed inbound emails and creates/threads tickets.
 *
 * These are API-level tests using Playwright's `request` fixture —
 * no browser is needed.
 *
 * The test backend reads WEBHOOK_AUTH_TOKEN from backend/.env.test.
 * All requests must include the `x-webhook-secret` header with the
 * matching value to pass the requireWebhookSecret middleware.
 */

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const WEBHOOK_URL = "/api/webhooks/inbound-email";
const WEBHOOK_SECRET = "test-webhook-secret-for-e2e";

const BACKEND_DIR = path.resolve(__dirname, "../backend");
const DOTENV_PREFIX = "bunx dotenv -e .env.test --";
const UPDATE_STATUS_SCRIPT = "tsx ../e2e/helpers/update-ticket-status.ts";

/**
 * Update a ticket's status directly in the test database via Prisma.
 * Used by tests that need to set a ticket to RESOLVED or CLOSED before
 * testing webhook behavior against those states.
 */
function updateTicketStatus(ticketId: number, status: string) {
  const backendNodeModules = path.join(BACKEND_DIR, "node_modules");
  execSync(
    `${DOTENV_PREFIX} ${UPDATE_STATUS_SCRIPT} --id "${ticketId}" --status "${status}"`,
    {
      cwd: BACKEND_DIR,
      stdio: "pipe",
      env: { ...process.env, NODE_PATH: backendNodeModules },
    },
  );
}

/** Base headers included in every authenticated webhook request. */
const webhookHeaders = {
  "x-webhook-secret": WEBHOOK_SECRET,
  "Content-Type": "application/json",
};

/** Build a valid inbound email payload, overriding defaults as needed. */
function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    from: "John Doe <john@example.com>",
    to: "support@yourdomain.com",
    subject: "Cannot login",
    text: "Hi, I need help logging in.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Webhook Authentication (requireWebhookSecret middleware)
// ---------------------------------------------------------------------------

test.describe("Webhook authentication", () => {
  test("should return 401 when x-webhook-secret header is missing", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload(),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Missing x-webhook-secret header");
  });

  test("should return 403 when x-webhook-secret header is invalid", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload(),
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "wrong-secret-value",
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Invalid webhook secret");
  });

  test("should accept request with correct x-webhook-secret header", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ subject: "Auth acceptance test" }),
      headers: webhookHeaders,
    });

    // A valid request with correct secret should not be 401 or 403
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);
    expect(response.status()).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Payload Validation (inboundEmailSchema via validate middleware)
// ---------------------------------------------------------------------------

test.describe("Payload validation", () => {
  test("should reject payload when 'from' field is missing", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ from: undefined }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("rejected");
    expect(body.message).toBeTruthy();
  });

  test("should reject payload when 'to' field is missing", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ to: undefined }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("rejected");
    expect(body.message).toBeTruthy();
  });

  test("should reject payload when 'text' field is missing", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ text: undefined }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("rejected");
    expect(body.message).toBeTruthy();
  });

  test("should reject payload when 'from' field is empty string", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ from: "" }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("rejected");
  });

  test("should reject payload when 'text' field is empty string", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({ text: "" }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("rejected");
  });

  test("should default subject to '(no subject)' when omitted", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: {
        from: "No Subject User <nosubject@example.com>",
        to: "support@yourdomain.com",
        text: "Email with no subject line.",
      },
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("created");
    expect(body.ticketId).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Ticket Creation
// ---------------------------------------------------------------------------

test.describe("Ticket creation", () => {
  test("should create a new ticket from a valid inbound email", async ({
    request,
  }) => {
    const uniqueSubject = `Test ticket ${Date.now()}`;
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Alice Smith <alice@example.com>",
        subject: uniqueSubject,
        text: "I have a problem with my account.",
      }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("created");
    expect(typeof body.ticketId).toBe("number");
    expect(body.ticketId).toBeGreaterThan(0);
  });

  test("should create ticket with email-only sender (no display name)", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "plainuser@example.com",
        subject: `Plain sender ${Date.now()}`,
        text: "Sent from an email without a display name.",
      }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("created");
    expect(body.ticketId).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Duplicate Detection
// ---------------------------------------------------------------------------

test.describe("Duplicate detection", () => {
  test("should detect duplicate email sent twice within 5 minutes", async ({
    request,
  }) => {
    const uniqueSubject = `Duplicate test ${Date.now()}`;
    const payload = makePayload({
      from: "Dupe Sender <dupe@example.com>",
      subject: uniqueSubject,
      text: "This is a duplicate detection test email.",
    });

    // First request creates the ticket
    const first = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: webhookHeaders,
    });
    expect(first.status()).toBe(201);
    expect((await first.json()).status).toBe("created");

    // Second identical request should be detected as duplicate
    const second = await request.post(WEBHOOK_URL, {
      data: payload,
      headers: webhookHeaders,
    });
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.status).toBe("duplicate");
    expect(body.message).toBe("Duplicate email ignored");
  });

  test("should NOT flag as duplicate when subject and body both differ", async ({
    request,
  }) => {
    const ts = Date.now();
    const payload1 = makePayload({
      from: "NotDupe <notdupe@example.com>",
      subject: `Subject A ${ts}`,
      text: `First unique email body ${ts}-a`,
    });
    const payload2 = makePayload({
      from: "NotDupe <notdupe@example.com>",
      subject: `Subject B ${ts}`,
      text: `Second unique email body ${ts}-b`,
    });

    const first = await request.post(WEBHOOK_URL, {
      data: payload1,
      headers: webhookHeaders,
    });
    expect(first.status()).toBe(201);

    const second = await request.post(WEBHOOK_URL, {
      data: payload2,
      headers: webhookHeaders,
    });
    expect(second.status()).toBe(201);
    expect((await second.json()).status).toBe("created");
  });
});

// ---------------------------------------------------------------------------
// Threading via Plus-Addressing (support+<id>@)
// ---------------------------------------------------------------------------

test.describe("Threading via plus-addressing", () => {
  test("should thread message onto existing ticket via support+<id>@ in 'to' field", async ({
    request,
  }) => {
    // Step 1: Create a ticket
    const createPayload = makePayload({
      from: "Thread User <thread@example.com>",
      subject: `Plus addressing test ${Date.now()}`,
      text: "Initial message for plus-addressing thread test.",
    });
    const createRes = await request.post(WEBHOOK_URL, {
      data: createPayload,
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Reply to the ticket via plus-addressing
    const replyPayload = makePayload({
      from: "Thread User <thread@example.com>",
      to: `support+${ticketId}@yourdomain.com`,
      subject: `Re: Plus addressing test`,
      text: "This is a threaded reply via plus-addressing.",
    });
    const replyRes = await request.post(WEBHOOK_URL, {
      data: replyPayload,
      headers: webhookHeaders,
    });

    expect(replyRes.status()).toBe(200);
    const body = await replyRes.json();
    expect(body.status).toBe("threaded");
    expect(body.ticketId).toBe(ticketId);
    expect(typeof body.messageId).toBe("number");
    expect(body.messageId).toBeGreaterThan(0);
  });

  test("should create new ticket when sender email does not match original ticket sender", async ({
    request,
  }) => {
    // Step 1: Create a ticket from sender A
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Sender A <sender-a@example.com>",
        subject: `Mismatch sender test ${Date.now()}`,
        text: "Ticket from sender A.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Different sender B tries to reply via plus-addressing
    const replyRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Sender B <sender-b@example.com>",
        to: `support+${ticketId}@yourdomain.com`,
        subject: "Re: Mismatch sender test",
        text: "Reply from a different sender.",
      }),
      headers: webhookHeaders,
    });

    // Should create a new ticket instead of threading, because sender doesn't match
    expect(replyRes.status()).toBe(201);
    const body = await replyRes.json();
    expect(body.status).toBe("created");
    expect(body.ticketId).not.toBe(ticketId);
  });
});

// ---------------------------------------------------------------------------
// Threading via [Ticket #N] in Subject
// ---------------------------------------------------------------------------

test.describe("Threading via [Ticket #N] in subject", () => {
  test("should thread message when subject contains [Ticket #N]", async ({
    request,
  }) => {
    // Step 1: Create a ticket
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Subject Tag User <subjecttag@example.com>",
        subject: `Subject tag test ${Date.now()}`,
        text: "Initial message for subject tag thread test.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Reply with [Ticket #N] in subject
    const replyRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Subject Tag User <subjecttag@example.com>",
        to: "support@yourdomain.com",
        subject: `Re: Subject tag test [Ticket #${ticketId}]`,
        text: "This is a threaded reply via subject tag.",
      }),
      headers: webhookHeaders,
    });

    expect(replyRes.status()).toBe(200);
    const body = await replyRes.json();
    expect(body.status).toBe("threaded");
    expect(body.ticketId).toBe(ticketId);
    expect(typeof body.messageId).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// Reopening Resolved Tickets
// ---------------------------------------------------------------------------

test.describe("Reopening resolved tickets", () => {
  test("should reopen a RESOLVED ticket when the original sender replies", async ({
    request,
  }) => {
    // Step 1: Create a ticket via webhook
    const uniqueSubject = `Reopen test ${Date.now()}`;
    const senderEmail = "reopen@example.com";
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: `Reopen User <${senderEmail}>`,
        subject: uniqueSubject,
        text: "Original message for reopen test.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Set ticket status to RESOLVED via direct DB update
    updateTicketStatus(ticketId, "RESOLVED");

    // Step 3: Original sender replies — ticket should be reopened
    const replyRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: `Reopen User <${senderEmail}>`,
        to: `support+${ticketId}@yourdomain.com`,
        subject: `Re: ${uniqueSubject}`,
        text: "I still have this problem, please help.",
      }),
      headers: webhookHeaders,
    });

    expect(replyRes.status()).toBe(200);
    const replyBody = await replyRes.json();
    expect(replyBody.status).toBe("threaded");
    expect(replyBody.ticketId).toBe(ticketId);
  });
});

// ---------------------------------------------------------------------------
// Closed Ticket Rejection
// ---------------------------------------------------------------------------

test.describe("Closed ticket rejection", () => {
  test("should return error when replying to a CLOSED ticket", async ({
    request,
  }) => {
    // Step 1: Create a ticket via webhook
    const senderEmail = "closed@example.com";
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: `Closed User <${senderEmail}>`,
        subject: `Closed ticket test ${Date.now()}`,
        text: "Original message for closed ticket test.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Set ticket status to CLOSED via direct DB update
    updateTicketStatus(ticketId, "CLOSED");

    // Step 3: Original sender tries to reply — should fail
    const replyRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: `Closed User <${senderEmail}>`,
        to: `support+${ticketId}@yourdomain.com`,
        subject: "Re: Closed ticket test",
        text: "Trying to reply to a closed ticket.",
      }),
      headers: webhookHeaders,
    });

    // The addMessageToTicket service throws AppError(400, "Cannot add messages to a closed ticket")
    // Express error handler returns { error: "..." } with the status code
    expect(replyRes.status()).toBe(400);
    const body = await replyRes.json();
    expect(body.error).toBe("Cannot add messages to a closed ticket");
  });
});

// ---------------------------------------------------------------------------
// Subject Prefix Stripping
// ---------------------------------------------------------------------------

test.describe("Subject prefix stripping", () => {
  test("should strip Re: prefix from subject", async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Prefix User <prefix@example.com>",
        subject: "Re: Help with my order",
        text: `Prefix strip test re ${Date.now()}`,
      }),
      headers: webhookHeaders,
    });

    // The ticket is created successfully (prefix stripping happens internally)
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("created");
    expect(body.ticketId).toBeGreaterThan(0);
  });

  test("should strip nested Re: Fwd: prefixes from subject", async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Nested Prefix <nested@example.com>",
        subject: "Re: Re: Fwd: RE: FW: Help me please",
        text: `Nested prefix test ${Date.now()}`,
      }),
      headers: webhookHeaders,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("created");
    expect(body.ticketId).toBeGreaterThan(0);
  });

  test("should thread correctly when reply subject has Re: prefix and [Ticket #N]", async ({
    request,
  }) => {
    // Step 1: Create a ticket
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Prefix Thread <prefixthread@example.com>",
        subject: `Prefix thread test ${Date.now()}`,
        text: "Original for prefix thread test.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Reply with Re: prefix and [Ticket #N] — should still thread
    const replyRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Prefix Thread <prefixthread@example.com>",
        to: "support@yourdomain.com",
        subject: `Re: Fwd: Prefix thread test [Ticket #${ticketId}]`,
        text: "Reply with prefixes in subject.",
      }),
      headers: webhookHeaders,
    });

    expect(replyRes.status()).toBe(200);
    const body = await replyRes.json();
    expect(body.status).toBe("threaded");
    expect(body.ticketId).toBe(ticketId);
  });
});

// ---------------------------------------------------------------------------
// Envelope Support
// ---------------------------------------------------------------------------

test.describe("Envelope field support", () => {
  test("should extract ticket ID from envelope.to for plus-addressing", async ({
    request,
  }) => {
    // Step 1: Create a ticket
    const createRes = await request.post(WEBHOOK_URL, {
      data: makePayload({
        from: "Envelope User <envelope@example.com>",
        subject: `Envelope test ${Date.now()}`,
        text: "Original message for envelope test.",
      }),
      headers: webhookHeaders,
    });
    expect(createRes.status()).toBe(201);
    const { ticketId } = await createRes.json();

    // Step 2: Reply using envelope.to for plus-addressing
    // The 'to' field is a plain address, but envelope.to has the plus-address
    const replyRes = await request.post(WEBHOOK_URL, {
      data: {
        from: "Envelope User <envelope@example.com>",
        to: "support@yourdomain.com",
        subject: "Re: Envelope test",
        text: "Reply routed via envelope plus-addressing.",
        envelope: {
          from: "envelope@example.com",
          to: [`support+${ticketId}@yourdomain.com`],
        },
      },
      headers: webhookHeaders,
    });

    expect(replyRes.status()).toBe(200);
    const body = await replyRes.json();
    expect(body.status).toBe("threaded");
    expect(body.ticketId).toBe(ticketId);
  });
});

import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

/**
 * Authentication E2E Tests
 *
 * Tests cover login flow, client-side validation, server-side error handling,
 * logout flow, protected route guards, and role-based access control.
 *
 * Seed data (from global-setup):
 *   - Admin: admin@example.com / password123 (role: ADMIN, name: "System Admin")
 *
 * Agent users are created via a helper script that uses better-auth's
 * internal server-side API, since the HTTP sign-up endpoint is disabled.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKEND_DIR = path.resolve(__dirname, "../backend");
const DOTENV_PREFIX = "bunx dotenv -e .env.test --";
const CREATE_AGENT_SCRIPT = "tsx ../e2e/helpers/create-agent-user.ts";

const ADMIN = {
  email: "admin@example.com",
  password: "password123",
  name: "System Admin",
};

const AGENT = {
  email: "agent-e2e-test@example.com",
  password: "password123",
  name: "E2E Test Agent",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in through the UI and wait for redirect to home page. */
async function loginViaUI(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
}

/**
 * Create an agent user in the test database using the helper script.
 * Runs from backend/ dir so dotenv picks up .env.test; sets NODE_PATH
 * so that bare imports (better-auth, etc.) resolve from backend/node_modules.
 */
function ensureAgentUser(name: string, email: string, password: string) {
  const backendNodeModules = path.join(BACKEND_DIR, "node_modules");
  execSync(
    `${DOTENV_PREFIX} ${CREATE_AGENT_SCRIPT} --name "${name}" --email "${email}" --password "${password}"`,
    {
      cwd: BACKEND_DIR,
      stdio: "pipe",
      env: { ...process.env, NODE_PATH: backendNodeModules },
    },
  );
}

// ---------------------------------------------------------------------------
// One-time setup: create agent user for tests that need it
// ---------------------------------------------------------------------------

test.beforeAll(() => {
  ensureAgentUser(AGENT.name, AGENT.email, AGENT.password);
});

// ---------------------------------------------------------------------------
// Login Flow
// ---------------------------------------------------------------------------

test.describe("Login flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login page with correct title and description", async ({
    page,
  }) => {
    await expect(page.locator("[data-slot='card-title']")).toHaveText("Sign In");
    await expect(page.getByText("AI Ticket Management System")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" }),
    ).toBeVisible();
  });

  test("should login successfully as admin and redirect to home page", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /Welcome, System Admin/i }),
    ).toBeVisible();
  });

  test("should login successfully as agent and redirect to home page", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(AGENT.email);
    await page.getByLabel("Password").fill(AGENT.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /Welcome, E2E Test Agent/i }),
    ).toBeVisible();
  });

  test("should show error for invalid credentials (wrong password)", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Server error message appears below the form fields
    await expect(
      page.getByText(/invalid|incorrect|unauthorized/i),
    ).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show error for non-existent email", async ({ page }) => {
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText(/invalid|not found|incorrect|unauthorized/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});

// ---------------------------------------------------------------------------
// Client-Side Validation
// ---------------------------------------------------------------------------

test.describe("Login form client-side validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should show validation error for empty email", async ({ page }) => {
    // Leave email empty, fill password, submit
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email"),
    ).toBeVisible();
  });

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    // Fill an invalid email that passes browser native validation but fails zod
    // Native type="email" validation requires @ sign, so use a format that
    // passes native but fails zod's stricter email check
    const emailInput = page.getByLabel("Email");
    await emailInput.fill("not-an-email");
    // Remove the type="email" attribute so native validation doesn't block submit
    await emailInput.evaluate((el) => el.removeAttribute("type"));
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email"),
    ).toBeVisible();
  });

  test("should show validation error for empty password", async ({ page }) => {
    await page.getByLabel("Email").fill("admin@example.com");
    // Leave password empty, submit
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should show both validation errors when both fields are empty", async ({
    page,
  }) => {
    // Submit with both fields empty
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email"),
    ).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Already Authenticated Redirect
// ---------------------------------------------------------------------------

test.describe("Already authenticated user", () => {
  test("should redirect from /login to / when already authenticated", async ({
    page,
  }) => {
    // First, log in
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL("/");

    // Now navigate to /login -- should be redirected back to /
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------
// Logout Flow
// ---------------------------------------------------------------------------

test.describe("Logout flow", () => {
  test("should sign out and redirect to login page", async ({ page }) => {
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Sign Out" }).click();

    await expect(page).toHaveURL(/.*login/);
  });

  test("should not be able to access protected route after sign out", async ({
    page,
  }) => {
    // Log in first
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL("/");

    // Sign out
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/.*login/);

    // Try navigating to protected home page
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });
});

// ---------------------------------------------------------------------------
// Protected Routes
// ---------------------------------------------------------------------------

test.describe("Protected route access", () => {
  test("should redirect unauthenticated user from / to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("should redirect unauthenticated user from /users to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/.*login/);
  });
});

// ---------------------------------------------------------------------------
// Role-Based Access Control
// ---------------------------------------------------------------------------

test.describe("Role-based access control", () => {
  test.describe("Admin user", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, ADMIN.email, ADMIN.password);
    });

    test("should see Users link in navbar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: "Users" }),
      ).toBeVisible();
    });

    test("should be able to access /users page", async ({ page }) => {
      await page.getByRole("link", { name: "Users" }).click();
      await expect(page).toHaveURL("/users");
      await expect(
        page.getByRole("heading", { name: "Users" }),
      ).toBeVisible();
    });
  });

  test.describe("Agent user", () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, AGENT.email, AGENT.password);
    });

    test("should NOT see Users link in navbar", async ({ page }) => {
      // Verify the navbar is visible (user name shows in nav)
      const navbar = page.locator("nav");
      await expect(navbar.getByText(AGENT.name)).toBeVisible();

      // The "Users" link should not be present for agents
      await expect(
        page.getByRole("link", { name: "Users" }),
      ).not.toBeVisible();
    });

    test("should be redirected from /users to /", async ({ page }) => {
      // Try to access admin-only /users page
      await page.goto("/users");

      // Agent should be redirected to home
      await expect(page).toHaveURL("/");
    });
  });
});

// ---------------------------------------------------------------------------
// Submit Button Behavior
// ---------------------------------------------------------------------------

test.describe("Submit button behavior", () => {
  test("should disable submit button and show loading text while submitting", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);

    const submitButton = page.getByRole("button", { name: "Sign In" });

    // Intercept the auth request to slow it down so we can observe the loading state
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await submitButton.click();

    // Button should be disabled and show "Signing in..." while request is in flight
    await expect(
      page.getByRole("button", { name: "Signing in..." }),
    ).toBeDisabled();

    // Wait for navigation to complete (form submission succeeds)
    await page.waitForURL("/");
  });

  test("should prevent multiple rapid form submissions", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);

    // Track how many sign-in requests are made
    let requestCount = 0;
    page.on("request", (req) => {
      if (
        req.url().includes("/api/auth/sign-in/email") &&
        req.method() === "POST"
      ) {
        requestCount++;
      }
    });

    // Slow the response so button stays disabled long enough to attempt a second click
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    const submitButton = page.getByRole("button", { name: "Sign In" });

    // Click the submit button
    await submitButton.click();

    // Button becomes disabled with "Signing in..." text
    const disabledButton = page.getByRole("button", { name: "Signing in..." });
    await expect(disabledButton).toBeDisabled();

    // Attempt to force-click the disabled button -- this should NOT trigger another request
    await disabledButton.click({ force: true }).catch(() => {
      // Expected: button is disabled
    });

    // Wait for navigation
    await page.waitForURL("/");

    // Only one request should have been made
    expect(requestCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Navbar Content
// ---------------------------------------------------------------------------

test.describe("Navbar content after login", () => {
  test("should display app title, user name, and Sign Out button", async ({
    page,
  }) => {
    await loginViaUI(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL("/");

    // Navbar title
    await expect(page.getByText("AI Ticket System")).toBeVisible();

    // User name displayed in navbar
    const navbar = page.locator("nav");
    await expect(navbar.getByText(ADMIN.name)).toBeVisible();

    // Sign Out button
    await expect(
      page.getByRole("button", { name: "Sign Out" }),
    ).toBeVisible();
  });
});

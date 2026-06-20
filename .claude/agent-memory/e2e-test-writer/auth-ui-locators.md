---
name: auth-ui-locators
description: Verified Playwright locators for login page, navbar, home page, and users page
metadata:
  type: project
---

Locators verified against actual source code (LoginPage.tsx, Navbar.tsx, HomePage.tsx, UsersPage.tsx):

**Login Page (`/login`)**
- Email field: `page.getByLabel("Email")` — Label htmlFor="email", Input id="email"
- Password field: `page.getByLabel("Password")` — Label htmlFor="password", Input id="password"
- Submit button: `page.getByRole("button", { name: "Sign In" })` — Button type="submit"
- Loading state: `page.getByRole("button", { name: "Signing in..." })` — disabled, includes Loader2 SVG (aria-hidden)
- Heading: `page.getByRole("heading", { name: "Sign In" })` — CardTitle renders as heading
- Description: `page.getByText("AI Ticket Management System")` — CardDescription
- Email validation: `page.getByText("Please enter a valid email")` — zod error
- Password validation: `page.getByText("Password is required")` — zod error
- Server error: appears as `<p className="text-sm text-destructive">` with message from better-auth

**Navbar (AppLayout > Navbar)**
- Title: `page.getByText("AI Ticket System")` — h1
- User name: `page.getByText("System Admin")` — span with user.name
- Sign Out: `page.getByRole("button", { name: "Sign Out" })` — native button
- Users link (admin only): `page.getByRole("link", { name: "Users" })` — React Router Link renders as <a>

**Home Page (`/`)**
- Welcome heading: `page.getByRole("heading", { name: /Welcome, <name>/i })` — h2

**Users Page (`/users`)**
- Heading: `page.getByRole("heading", { name: "Users" })` — h1

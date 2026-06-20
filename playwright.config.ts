import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  webServer: [
    {
      command: "bunx dotenv -e .env.test -- tsx watch src/index.ts",
      cwd: "./backend",
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "bunx vite --port 5174 --mode test",
      cwd: "./frontend",
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

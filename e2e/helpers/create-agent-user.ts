/**
 * Standalone script to create an agent user in the test database.
 *
 * Called from auth.spec.ts via execSync. Runs with cwd = backend directory
 * and NODE_PATH set to backend/node_modules so that bare imports
 * (better-auth, etc.) resolve correctly.
 *
 * Environment variables (DATABASE_URL, BETTER_AUTH_SECRET, etc.) must be
 * injected via dotenv pointing at backend/.env.test.
 *
 * If the user already exists (by email), it is silently skipped.
 */

import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Derive __dirname for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirnameSafe = path.dirname(__filename);

// Resolve the Prisma client path relative to this file's location.
// Use pathToFileURL for cross-platform dynamic import compatibility on Windows.
const PRISMA_CLIENT_URL = pathToFileURL(
  path.resolve(
    __dirnameSafe,
    "../../backend/src/generated/prisma-client/index.js",
  ),
).href;

function parseArgs(): { name: string; email: string; password: string } {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    map.set(args[i].replace(/^--/, ""), args[i + 1]);
  }
  const name = map.get("name");
  const email = map.get("email");
  const password = map.get("password");
  if (!name || !email || !password) {
    console.error("Usage: --name <name> --email <email> --password <password>");
    process.exit(1);
  }
  return { name, email, password };
}

async function main() {
  const { name, email, password } = parseArgs();

  // Dynamic import of PrismaClient using file:// URL for Windows compatibility
  const { PrismaClient } = await import(PRISMA_CLIENT_URL);
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Agent user already exists: ${email}`);
      return;
    }

    const seedAuth = betterAuth({
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "test-secret-key-for-playwright-testing-only",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
      emailAndPassword: { enabled: true },
    });

    try {
      const result = await seedAuth.api.signUpEmail({
        body: { name, email, password },
      });
      console.log(`Created agent user: ${result.user.email} (role: AGENT)`);
    } catch (err: any) {
      if (err?.body?.code === "FAILED_TO_CREATE_USER" || err?.status === "UNPROCESSABLE_ENTITY") {
        console.log(`Agent user already exists (race condition): ${email}`);
      } else {
        throw err;
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed to create agent user:", e);
  process.exit(1);
});

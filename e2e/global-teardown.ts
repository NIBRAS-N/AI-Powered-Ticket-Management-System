import { execSync } from "child_process";
import path from "path";

const backendDir = path.resolve(__dirname, "../backend");
const dotenvPrefix = "bunx dotenv -e .env.test --";

export default async function globalTeardown() {
  console.log("\n[e2e] Cleaning up test database...");

  try {
    execSync(
      `${dotenvPrefix} bunx prisma migrate reset --force --skip-seed --skip-generate`,
      {
        cwd: backendDir,
        stdio: "inherit",
        env: {
          ...process.env,
          PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
        },
      },
    );
  } catch {
    console.warn(
      "[e2e] Could not reset test database — manual cleanup may be needed.",
    );
  }

  console.log("[e2e] Teardown complete.\n");
}

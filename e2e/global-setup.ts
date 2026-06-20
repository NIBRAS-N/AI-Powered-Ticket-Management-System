import { execSync } from "child_process";
import path from "path";

const backendDir = path.resolve(__dirname, "../backend");
const dotenvPrefix = "bunx dotenv -e .env.test --";

export default async function globalSetup() {
  console.log("\n[e2e] Setting up test database...");

  execSync(`${dotenvPrefix} bunx prisma migrate deploy`, {
    cwd: backendDir,
    stdio: "inherit",
  });

  execSync(`${dotenvPrefix} tsx prisma/seed.ts`, {
    cwd: backendDir,
    stdio: "inherit",
  });

  console.log("[e2e] Test database ready.\n");
}

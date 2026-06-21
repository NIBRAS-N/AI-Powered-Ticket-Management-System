/**
 * Standalone script to update a ticket's status in the test database.
 *
 * Called from webhook e2e tests via execSync. Runs with cwd = backend
 * directory and NODE_PATH set to backend/node_modules.
 *
 * Environment variables (DATABASE_URL, etc.) must be injected via dotenv
 * pointing at backend/.env.test.
 *
 * Usage: --id <ticketId> --status <OPEN|RESOLVED|CLOSED>
 */

import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirnameSafe = path.dirname(__filename);

const PRISMA_CLIENT_URL = pathToFileURL(
  path.resolve(
    __dirnameSafe,
    "../../backend/src/generated/prisma-client/index.js",
  ),
).href;

function parseArgs(): { id: number; status: string } {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    map.set(args[i].replace(/^--/, ""), args[i + 1]);
  }
  const id = map.get("id");
  const status = map.get("status");
  if (!id || !status) {
    console.error("Usage: --id <ticketId> --status <OPEN|RESOLVED|CLOSED>");
    process.exit(1);
  }
  const validStatuses = ["OPEN", "RESOLVED", "CLOSED"];
  if (!validStatuses.includes(status)) {
    console.error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    process.exit(1);
  }
  return { id: parseInt(id, 10), status };
}

async function main() {
  const { id, status } = parseArgs();

  const { PrismaClient } = await import(PRISMA_CLIENT_URL);
  const prisma = new PrismaClient();

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });
    console.log(`Updated ticket #${ticket.id} to status: ${ticket.status}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed to update ticket status:", e);
  process.exit(1);
});

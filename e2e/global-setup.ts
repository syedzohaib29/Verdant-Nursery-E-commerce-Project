import { copyFileSync, existsSync, rmSync } from "node:fs";

/**
 * Gives the e2e suite a private, seeded database.
 *
 * The seeded dev database is copied to `prisma/e2e.db` before the web server
 * boots. Tests read the same catalogue the shop seeds with and are free to
 * place orders, create products and flip statuses without touching the working
 * copy. Each run starts over: the copy is deleted and re-made first.
 */
export default function globalSetup(): void {
  if (!existsSync("prisma/dev.db")) {
    throw new Error(
      "prisma/dev.db is missing. Run `npm run db:seed` (or db:reset) before the e2e suite.",
    );
  }

  rmSync("prisma/e2e.db", { force: true });
  copyFileSync("prisma/dev.db", "prisma/e2e.db");
}
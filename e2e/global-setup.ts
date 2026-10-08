import "dotenv/config";

import { execFileSync } from "node:child_process";

/**
 * Gives the e2e suite a database it can safely wreck.
 *
 * The project used to point the suite at a private *copy* of the SQLite file —
 * `prisma/dev.db` duplicated to `prisma/e2e.db` — which gave each run a clean
 * catalogue to break. That trick stopped working when the driver moved to
 * Postgres: a managed database has no file to copy, so the suite now runs against
 * whatever `DATABASE_URL` points at.
 *
 * What replaces the copy:
 *
 * - `prisma migrate deploy` before anything else, so the schema is present on a
 *   database nobody has touched (a fresh Neon project, a new machine). It is the
 *   deploy variant on purpose: it applies migrations and never asks whether the
 *   database is empty, which is not a question a run that is about to create a
 *   dozen orders wants asked of it.
 * - A connectivity check afterwards, so a missing `DATABASE_URL` or an unreachable
 *   host is one clear line here rather than a timeout inside the first test.
 *
 * Tests are written to be additive — accounts and products carry a timestamp in
 * their name — so running against the development database leaves the seeded
 * catalogue intact. Point `DATABASE_URL` at a throwaway database if you would
 * rather be certain of it.
 *
 * `dotenv/config` is imported because Playwright launches this in a plain Node
 * process, where `process.env` is the shell's and nothing has read `.env` yet —
 * `next start` does its own loading, but this file runs before it does.
 */
export default function globalSetup(): void {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The e2e suite needs a real database — copy .env.example to .env and point it at Postgres.",
    );
  }

  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL points at a SQLite file. The app now runs on Postgres (@prisma/adapter-pg); set DATABASE_URL to a postgres:// connection string.",
    );
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
}

# Verdant project rules

- Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Prisma (SQLite dev), Auth.js v5, Zustand, Zod, Motion (import from "motion/react"), Recharts, Lucide.
- Money is ALWAYS stored as integer cents (SQLite has no Decimal). Format only at display with a single formatPrice() helper.
- SQLite has no reliable enum support: store statuses/roles as String and validate with Zod constants exported from /src/lib/constants.ts.
- Server Components by default. "use client" only for interactivity.
- Next.js 15: params and searchParams are Promises. Always await them.
- Every phase ends with: npm run lint && npx tsc --noEmit && npm run build. Zero errors, zero warnings before moving on.
- No TODOs, console.logs, dead buttons, mock functions, lorem ipsum, or unused code.
- Every data view needs loading, empty, and error states.
- Design: green/white/black only. Fonts: Bricolage Grotesque (headings) + Inter (body). No gradient blobs, no emoji icons, no purple/blue.
- Copy has a warm, knowledgeable, slightly witty nursery voice.
- After each phase: summarize what you built, list files changed, and give me exact steps to verify it.

## Verdant setup notes (verified)

- Installed Next.js is **16.3.8** and Tailwind is v4, so treat the Next.js docs in `node_modules/next/dist/docs/` as the source of truth over training data.
- Prisma is pinned to **7.10.0** on both `prisma` (devDependency) and `@prisma/client`. Do not upgrade to the 8.x release candidate: `@prisma/client@8.0.0-rc.*` is not published, so `prisma generate` would break.
- Prisma 7 requires an explicit driver adapter. Use the singleton in `/src/lib/prisma.ts` (`PrismaBetterSqlite3`); never call `new PrismaClient()` directly.
- The Prisma client is generated to `/src/generated/prisma` (gitignored). Run `npx prisma generate` after editing `prisma/schema.prisma`.
- `DATABASE_URL="file:./prisma/dev.db"` resolves relative to `prisma7.config.ts` at the project root, not the schema folder.
- npm blocks install scripts by default via the `allowScripts` allowlist in package.json. `prisma`, `@prisma/engines` and `better-sqlite3` are allowlisted because the Prisma engine and the SQLite native binary both require their install scripts.
- Format prices with `formatPrice()` from `/src/lib/format.ts`. Statuses and roles live in `/src/lib/constants.ts`.

## Polish tooling (read before any polish task)

- Before polishing any UI, read the frontend-design skill and apply it.
- Use the shadcn MCP to verify component APIs and variants before editing a shadcn component. Do not guess props.
- Follow vercel-react-best-practices for rendering, data fetching, bundle size and waterfalls.
- OUR PALETTE, FONTS AND SPACING TOKENS IN THIS FILE ALWAYS OVERRIDE ANY SKILL SUGGESTION. Never introduce new colors, fonts, or a second animation library.
- Polish means refining what exists. Do not add features, routes, or dependencies.
- Every polish pass ends with: npm run lint && npx tsc --noEmit && npm run build, then a before/after summary of what changed.

## Available skills

- `frontend-design` — `.opencode/skills/frontend-design/`
- `vercel-react-best-practices` — `.opencode/skills/vercel-react-best-practices/`
- `shadcn` — `.agents/skills/shadcn/` (also pulls in Prisma skills beside it)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Verdant project rules

## Stack
Next.js 15 App Router, TypeScript strict, Tailwind v4 (CSS-first @theme), shadcn/ui,
Prisma (SQLite dev), Auth.js v5, Zustand, Zod, React Hook Form, Motion (import from
"motion/react"), Recharts, Lucide, Sonner. No second animation library. No new deps
without asking.

## Technical rules
- Money is ALWAYS integer cents. One formatPrice() helper for display.
- SQLite: store roles/statuses as String, validate with Zod constants in /src/lib/constants.ts.
- Server Components by default. "use client" only for interactivity, kept as small as possible.
- Next.js 15: params and searchParams are Promises. Always await.
- Every server action: auth() where needed, Zod validation, ownership checks, try/catch
  returning {success, error, fieldErrors}.
- Never trust client prices or stock. Recompute on the server.
- Every data view has loading, empty, and error states.
- No TODOs, console.logs, dead buttons, mock functions, lorem ipsum, unused code.
- Every phase ends with: npm run lint && npx tsc --noEmit && npm run build.
  Zero errors and warnings. Then output: files changed, what to verify, and a
  change summary grouped Visual / Motion / Responsive / Accessibility / Performance.

## Design system
- Palette: ink #0B0F0C, forest #14532D, leaf #3E9B4F, mint #E6F2E8,
  warm-white #F8F8F4, white #FFFFFF. Green/white/black only.
- Use forest (not leaf) for text on light backgrounds to keep AA contrast.
- Fonts: Bricolage Grotesque (headings), Geist (body, tabular-nums for prices).
  Geist replaced Inter by owner decision on 2026-10-07 — it was the font picked
  at project setup; Bricolage stays the brand heading voice.
- Voice: warm, knowledgeable, lightly witty nursery owner. No generic marketing copy.

## Polish rules (apply to every phase)
1. Read the frontend-design skill first. Direction: warm, editorial, botanical,
   slightly tactile. Every decision serves it.
2. Remove AI tells: identical card grids, everything centered, uniform
   rounded-xl + shadow-md, vague copy ("Discover our amazing collection"),
   meaningless decorative icons, equal spacing between all sections.
3. Scale contrast: one oversized element per section, small uppercase eyebrows,
   tight heading tracking, generous whitespace.
4. Section rhythm: vary background (warm-white, white, mint, forest, ink),
   alignment, and density between neighbors.
5. Craft details: 8px spacing scale, hairline borders (ink/10), soft low shadows,
   one icon set and stroke width, hover/pressed/focus/disabled states everywhere.
6. Motion: 300-500ms, ease [0.22,1,0.36,1], one orchestrated entrance per view.
   Honor prefers-reduced-motion.
7. Do not change functionality, routes, palette, or fonts during polish.
8. Check 360, 390, 768, 1024, 1280, 1536px. No horizontal scroll, no clipped text,
   touch targets >= 44px.

## Tooling
- Use the shadcn MCP to verify component APIs before editing shadcn components.
- Follow vercel-react-best-practices for data fetching, rendering, and bundle size.
- Our palette, fonts, and spacing tokens override any skill suggestion.

## Environment notes (verified, not instructions)
These are facts about this checkout that cost real debugging time. Keep them accurate.
- Installed Next.js is **16.3.8**, not 15. Treat `node_modules/next/dist/docs/` as
  authoritative over training data and over the "Next.js 15" line above.
- Prisma is pinned to **7.10.0** for both `prisma` and `@prisma/client`. Do not move to
  8.x: `@prisma/client@8.0.0-rc.*` is unpublished, so `prisma generate` breaks.
- Prisma 7 needs an explicit driver adapter. Use the singleton in `/src/lib/prisma.ts`
  (`PrismaBetterSqlite3`); never call `new PrismaClient()` bare.
- Generated client lives in `/src/generated/prisma` (gitignored). Re-run
  `npx prisma generate` after editing `prisma/schema.prisma`.
- `DATABASE_URL="file:./prisma/dev.db"` resolves relative to `prisma7.config.ts` at the
  project root, not the schema folder.
- npm blocks install scripts unless allowlisted in package.json. `prisma`,
  `@prisma/engines` and `better-sqlite3` must stay allowlisted or the engine and the
  SQLite native binary silently fail to build.
- `shadcn` must stay `^4.21.1`. Do not reinstall the `shadcn` name blindly: `shadcn@1.0.0`
  is an empty squatter package with no `tailwind.css`.
- Turbopack does not read the `style` export condition, so `next.config.ts` aliases
  `shadcn/tailwind.css` -> `shadcn/dist/tailwind.css`. Removing that alias breaks the build.
- Helpers: `formatPrice()` in `/src/lib/format.ts`; statuses/roles in
  `/src/lib/constants.ts`.
- The palette is single-theme (light only): there is no `.dark` block and nothing
  applies a `.dark` class, so the `dark:` variants shipped inside the vendored
  `src/components/ui/*` files are inert. Add a real theme before relying on them.
- Seed data lives in `prisma/seed.ts`; run `npm run db:seed`. DB scripts are
  `db:migrate`, `db:generate`, `db:seed`, `db:studio`.
- Brand tokens are `--color-ink|forest|leaf|mint|warm-white`, defined as OKLCH in
  `src/app/globals.css` with the source hex in a comment. Leaf is 3.5:1 on white,
  so use forest for text on light backgrounds.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

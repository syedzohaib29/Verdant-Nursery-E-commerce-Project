# Verdant

A calm plant nursery storefront — Next.js 16 (App Router), TypeScript, Tailwind v4,
Prisma (SQLite), Auth.js v5, React Hook Form + Zod, Motion, Lucide, Sonner.

Developed by **Syed Zohaib** — [GitHub](https://github.com/syedzohaib29) · [LinkedIn](https://www.linkedin.com/in/syed-zohaib-b9a47b204)

## Getting started

```bash
npm install
cp .env.example .env        # then fill in AUTH_SECRET (npx auth secret) and DATABASE_URL
npm run db:migrate          # applies migrations
npm run db:seed             # demo catalogue, users, addresses, promo code
npm run dev
```

Open http://localhost:3000.

Demo accounts (seeded): `admin@verdant.dev` / `Admin@12345`, `demo@verdant.dev` /
`Demo@12345`, customers `firstname.lastname@example.com` + `Firstname@12345`, and
the gardener `gardener@example.com` / `Password@1`.

## Checkout

`/checkout` works signed-in or as a guest. Signed-in customers get their default
address and address book prefilled; guests type everything in.

- **Cash on delivery** is always available — nothing is charged today, you settle
  with the driver.
- **Card (Stripe, test mode)** appears automatically when `STRIPE_SECRET_KEY` is
  set. The payment happens on Stripe's hosted page; the webhook at
  `/api/webhooks/stripe` marks the order paid.
- **Test card:** `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

Every price, discount and stock count is recomputed on the server when the order
is placed — the browser's numbers are display data. Placing is idempotent per
checkout attempt (a retried submit returns the same order), stock is decremented
inside a transaction with a guarded per-line `updateMany` (overstock is refused
and nothing is partially charged), and a card order whose payment page fails to
open is unwound completely (order deleted, stock restored).

### Running the Stripe webhook locally

With the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the dev
server. Without a Stripe key the card option is hidden and checkout is COD only.

No Stripe CLI? You can also forward a `checkout.session.completed` event by hand
with httpie — see the project notes, or just test the COD flow.

### Order confirmation email

`sendOrderEmail` logs the receipt to the dev server console when
`RESEND_API_KEY` is unset, and sends it through Resend when it is (plus
`EMAIL_FROM`). An email failure never fails an order — receipts are fire and
forget by design.

### Guest confirmation pages

Guests reach `/checkout/success?order=VRD-…` through a short-lived (1h), signed
`verdant_order` cookie set when the order is placed. Signed-in customers are
proven by ownership. The page 404s for anyone who guessed a URL — it never
confirms that an order number exists.

## Scripts

```bash
npm run dev             # development server
npm run build           # production build
npm run lint            # eslint
npm run db:migrate      # prisma migrate deploy
npm run db:generate     # prisma generate
npm run db:seed         # seed the database
npm run db:studio       # Prisma Studio (inspect stock & orders)
npm run test:unit       # Vitest unit tests
npm run test:e2e        # Playwright e2e (builds, then runs all projects)
npm run audit:responsive# Playwright responsive-overflow audit only
npm run analyze         # production build + bundle report in .next/analyze
npm run lighthouse      # Lighthouse audit against a running server on :3101
```

## Testing & checks

- **Unit** — `npm run test:unit` (Vitest). Money-order maths and Zod schemas, pure
  and DB-free so the checkout contract is testable without a database.
- **End to end** — `npm run test:e2e` (Playwright). Every run production-builds the
  app, copies the seeded dev database to `prisma/e2e.db`, starts `next start` on
  port 3101, and runs three projects: `desktop-chromium` (full customer + admin
  journeys), `mobile-chromium` (menu, drawer), and `responsive` (no horizontal
  scroll at 320–1536px across every route). `pretest:e2e` handles the build.
- **Bundle** — `npm run analyze` writes interactive report trees to
  `.next/analyze/{client,nodejs,edge}.html`.
- **Lighthouse** — `npm run lighthouse` audits `http://localhost:3101` using the
  Playwright Chromium binary.

## Money & data rules

- Money is always integer cents; one `formatPrice()` helper renders it.
- Statuses are plain strings validated against Zod constants in
  `src/lib/constants.ts`.
- The cart lives in localStorage as *wishes*; every server action re-reads the
  catalogue, and stale prices or stock are corrected (or the line removed) the
  moment a basket is checked.

## Going to production

The app is a plain Next.js 16 server — `npm run build` then `npm run start` —
so it deploys directly to Vercel, or to any Node 20+ host that keeps the
database reachable and carries the environment variables in `.env.example`.

- Auth.js signs its session tokens with `AUTH_SECRET`; always set it, and set
  `AUTH_TRUST_HOST="true"` whenever a proxy or load balancer rewrites Host.
- The production database is Postgres. The project pins Prisma 7 with an
  explicit driver adapter; swapping is three edits, not a rebuild:
  1. In `prisma/schema.prisma`, change `provider = "sqlite"` to
     `provider = "postgresql"`.
  2. In `src/lib/prisma.ts`, swap `PrismaBetterSqlite3` for the Postgres
     adapter (`@prisma/adapter-pg` / `PrismaPg`).
  3. Point `DATABASE_URL` at your Neon / RDS / self-hosted Postgres string,
     then `npx prisma migrate deploy && npx prisma generate`.

  All money, role and status fields are already provider-neutral (plain strings
  and integer cents), so the schema itself ports as-is.
- If you enable card payments, keep the Stripe webhook pointed at
  `/api/webhooks/stripe` and `STRIPE_WEBHOOK_SECRET` current; the card option
  remains hidden while `STRIPE_SECRET_KEY` is unset.
- Without `RESEND_API_KEY`, order confirmations are logged instead of emailed —
  set it (and `EMAIL_FROM`) for real receipts.

## SEO, security and accessibility

- `src/app/robots.ts` and each page's own `robots` metadata close checkout,
  account and admin to indexing twice.
- Every page ships `next/image` with sized `alt` text, colour contrast on the
  forest-on-light-green pairing (leaf is reserved for surfaces because it sits
  at 3.5:1 on white), touch-target minimums of 44px, and a visible legal
  preference for `prefers-reduced-motion`.
- Lighthouse at audit time: **SEO 100, best-practices 96, accessibility 96**.
  Performance measures ~80/100 on mobile simulated throttling: FCP ~1.2s,
  TBT ~130ms, while LCP is reported late because the hero photograph waits
  on a CSS entrance animation. Security headers (CSP,
  X-Frame-Options, Permissions-Policy, nosniff, strict Referrer-Policy)
  are set for every route.
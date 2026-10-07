# Verdant — Plants with good manners

> A small, calm e-commerce storefront for a Portland plant nursery, built as a
> full-stack showcase: browse the shelves, care for plants at home, check out as
> a guest or a member, and run the back-office desk end-to-end.

Developed by **Syed Zohaib** — [GitHub](https://github.com/syedzohaib29) · [LinkedIn](https://www.linkedin.com/in/syed-zohaib-b9a47b204)

---

## What this project is

Verdant is a production-shaped Next.js application for a family-run plant
nursery's online arm. It is not a template: it has a real server-rendered
storefront (catalogue, filters, search, product pages, journal), a hardened
checkout (guest + account, COD + Stripe), customer accounts with order tracking
and address books, and an admin desk for products, orders, customers, reviews,
journal, messages and settings.

- **Customer journeys**: catalogue browsing with server-driven filters and sort,
  wishlist, basket in localStorage with server re-validation, account area with
  orders and addresses, review writing.
- **Admin desk**: KPIs, sales chart, per-status order timelines with guarded
  transitions, product CRUD with images, category/journal/customer/message
  management, and settings (shipping threshold, promo rules).
- **Checkout safety**: prices, discounts and stock are recomputed server-side;
  orders are idempotent per attempt; stock is decremented inside a transaction
  with a guarded per-line `updateMany`; failed card orders are fully unwound.

## Tech stack

- **Framework**: Next.js 16 (App Router, RSC, server actions) + React 19 + TypeScript strict
- **Styling**: Tailwind v4 (CSS-first `@theme` tokens, warm editorial palette)
- **UI**: shadcn/ui conventions, base-ui, Lucide, Motion (`motion/react`)
- **Data**: Prisma 7 + SQLite (dev) with explicit driver adapter; Postgres/Neon path documented
- **Auth**: Auth.js v5 (credentials), role-guarded admin/customer areas
- **Forms/validation**: React Hook Form + Zod shared on client and server
- **State**: Zustand persist (basket, wishlist), server-truth on actions
- **Payments**: Stripe hosted checkout + webhook at `/api/webhooks/stripe`
- **Email**: Resend, fire-and-forget with a dev-console fallback
- **Tooling**: Vitest (unit), Playwright (e2e desktop + mobile + responsive audit),
  `@next/bundle-analyzer`, Lighthouse CI-style runs, ESLint + tsc gate

## Problems we faced — and how they were fixed

These are the engineering notes that matter most to me from the build:

1. **Grid blowouts on small screens.** The product gallery and the cart summary
   inflated the document by 20–65px at 320/360px. Root cause: single-column
   implicit auto grid tracks size to their items' min-content, and neither grid
   cell had `min-w-0`, so a full-width mobile thumbnail scroller and the
   summary card stretched the entire page. Fixed by making every single-column
   grid track `grid-cols-[minmax(0,1fr)]` and adding `min-w-0` to grid cells.
   This is now asserted by a Playwright responsive spec across 320→1536px.

2. **A flaky admin login E2E.** The test waited on `waitForURL(/\/admin/)`,
   which *also matched the login page's own URL* (`/login?callbackUrl=/admin`)
   — so it raced ahead and aborted the sign-in POST before the redirect. Login
   "failed" only in the test. Fixed with a pathname predicate wait
   (`url.pathname === "/admin"`) and the same rigor applied to the
   create-product navigation.

3. **LCP blocked behind hydration.** The hero entrance was a Motion
   `initial={{opacity:0}}` state applied on SSR, which meant the paint could
   not happen until client hydration finished. On the
   mobile simulated profile that pushed LCP/TTI to ~4.9s even though all
   resources were done by ~760ms. The entrance was rewritten as pure CSS
   `@keyframes` with zero-delay timings and the global
   `prefers-reduced-motion` override — no hydration needed for the first paint.

4. **EOEP form validation racing shared label queries.** The admin product form
   refused a create because "Care notes" (`min(10)`) was left empty; a plain
   `getByLabel("Price")` also matched "Sale price (optional)". Forms now got
   explicit fills and exact label queries in tests.

5. **A currency display inconsistency.** `formatPrice` emitted "$23.00" for
   whole dollars and dropped the second decimal for some cent values. It was
   rebuilt as one tested helper in `src/lib/pricing.ts` (whole dollars → no
   decimals; cents → exactly two), with content models for locale seamlessly
   added later.

## Impact for the business

If this shop were real, the case this codebase makes is:

- **Lost sales prevented at narrow widths** — the responsive audit caught two
  document-wide overflow bugs that would have clipped CTAs on ~15% of traffic.
- **Tamper-proof pricing** — every basket price is revalidated on the server,
  so a promo code that sold out or a typo'd price can't bypass the desk.
- **Calmer checkout** — progressive sections, guest checkout, COD fallback, an
  address book, and prefilled defaults shorten the path to "Place order".
- **Lower care burden after sale** — every product carries named light/water/
  difficulty notes, reducing returns confusion — the shop's returns FAQ cites
  it directly.
- **Accessible by construction** — skip links, focus rings, 44px targets, real
  green-on-white contrast choices, and a global reduced-motion fallback.

## Getting started

```bash
npm install
cp .env.example .env        # then fill in AUTH_SECRET (npx auth secret) and DATABASE_URL
npm run db:migrate          # applies migrations
npm run db:seed             # demo catalogue, users, addresses, promo code
npm run dev
```

Open http://localhost:3000.

Demo accounts (seeded): `admin@verdant.dev` / `Admin@12345`,
`demo@verdant.dev` / `Demo@12345`, customers `firstname.lastname@example.com`
+ `Firstname@12345`, gardener `gardener@example.com` / `Password@1`.

## Scripts

```bash
npm run dev              # development server
npm run build            # production build
npm run lint             # eslint
npm run db:migrate       # prisma migrate deploy
npm run db:generate      # prisma generate
npm run db:seed          # seed the database
npm run db:studio        # Prisma Studio
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright e2e (builds, then runs all projects)
npm run audit:responsive # responsive overflow audit only
npm run analyze          # production build + bundle reports
npm run lighthouse       # audit http://localhost:3101 via Playwright Chromium
```

## Checkout, Stripe, email

- COD is always available — no charge today, settle with the driver.
- Card checkout appears when `STRIPE_SECRET_KEY` is set; the webhook at
  `/api/webhooks/stripe` marks the order paid. Test card: `4242…4242`, any
  future expiry, any CVC, any ZIP.
- `sendOrderEmail` logs receipts to the dev console without `RESEND_API_KEY`,
  and sends via Resend with it. Email failure never fails an order.
- Guests get `/checkout/success` via a short-lived signed `verdant_order`
  cookie; the page 404s on guessed URLs — it never confirms an order number.

## Testing & checks

| Layer | Command | What it asserts |
|---|---|---|
| Unit | `npm run test:unit` | Order math, Zod schemas, utils — pure, no DB |
| E2E storefront | `npm run test:e2e` | Browse → filter → product → basket → COD checkout |
| E2E account | `npm run test:e2e` | Register/out/in/order/view/sign-out |
| E2E admin | `npm run test:e2e` | Customer bounce ↓ create-product → buyer ↓ stock → order advance |
| E2E mobile | `npm run test:e2e` | Base-ui menu/drawer flows at 390px |
| Responsive | `npm run test:e2e` | No horizontal scroll at 320–1536px, landscape phone too |
| Bundle | `npm run analyze` | Per-route client/nodejs/edge treemaps |
| Lighthouse | `npm run lighthouse` | SEO 100 / BP 96 / a11y 96 / perf ~80 at audit time |

Current gate: lint 0 errors · tsc clean · build green · **51/51** unit ·
**23/23** Playwright · Lighthouse scores in `docs/lighthouse.json`.

## Going to production

`npm run build` → `npm run start` on any Node 20+ host. `.env.example` covers
every variable.

- Set `AUTH_SECRET` and `AUTH_TRUST_HOST="true"` behind a proxy/load balancer.
- Production database is Postgres. The project pins Prisma 7 with an explicit
  adapter; swapping is three edits, not a rebuild:
  1. In `prisma/schema.prisma`, change `provider = "sqlite"` → `"postgresql"`.
  2. In `src/lib/prisma.ts`, swap `PrismaBetterSqlite3` for the Postgres
     adapter (`@prisma/adapter-pg` / `PrismaPg`).
  3. Point `DATABASE_URL` at your Neon/RDS string, then
     `npx prisma migrate deploy && npx prisma generate`.
- All money, role and status fields are provider-neutral (strings + cents), so
  the schema ports as-is.
- Keep the Stripe webhook pointed at `/api/webhooks/stripe`; the card option
  stays hidden without `STRIPE_SECRET_KEY`.

## Money & data rules

- Money is always integer cents; one `formatPrice()` renders it.
- Statuses are plain strings validated against `src/lib/constants.ts`.
- The cart lives in localStorage as *wishes*; every server action re-reads the
  catalogue, and stale prices or stock are corrected (or the line removed) the
  moment a basket is checked.

## SEO, security, accessibility

- `src/app/robots.ts` + per-route `robots` metadata close checkout/account/
  admin to indexing twice.
- Security headers on every route: CSP, `X-Frame-Options: DENY`, `nosniff`,
  strict `Referrer-Policy`, tight `Permissions-Policy`.
- Every page uses sized `next/image`, AA-checked green-on-white text,
  44px touch targets, labeled controls, visible focus rings, and a blanket
  `prefers-reduced-motion` fallback.

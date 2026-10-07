# Verdant

A calm plant nursery storefront — Next.js 16 (App Router), TypeScript, Tailwind v4,
Prisma (SQLite), Auth.js v5, React Hook Form + Zod, Motion, Lucide, Sonner.

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
npm run dev          # development server
npm run build        # production build
npm run lint         # eslint
npm run db:migrate   # prisma migrate deploy
npm run db:generate  # prisma generate
npm run db:seed      # seed the database
npm run db:studio    # Prisma Studio (inspect stock & orders during testing)
```

## Money & data rules

- Money is always integer cents; one `formatPrice()` helper renders it.
- Statuses are plain strings validated against Zod constants in
  `src/lib/constants.ts`.
- The cart lives in localStorage as *wishes*; every server action re-reads the
  catalogue, and stale prices or stock are corrected (or the line removed) the
  moment a basket is checked.
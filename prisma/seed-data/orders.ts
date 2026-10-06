/*
  Seed orders.

  Thirty orders across the last sixty days, shaped so the dashboard reads like a
  small nursery rather than like noise:

  - Saturdays carry the most weight and midweek the least. People buy plants at
    the weekend, and that is visible in the revenue chart.
  - Five of the orders land on a day that already has one, and five quiet days end
    up with none. A perfectly flat one-order-per-day spread is what a generator
    produces and what a shop does not.
  - There is a gentle upward trend. The last thirty days hold noticeably more
    orders than the first thirty, which is what word-of-mouth growth looks like.
  - Status follows age, not chance. Anything from the last few days is still
    pending or paid, anything older has been fulfilled, one order was cancelled
    after a card was declined and one was refunded. A status column that ignored
    the date would put a two-hour-old order in the same state as one from March.
  - About a third of orders are guest checkout, so the account-less path has real
    rows behind it rather than only happy-path data.
  - Roughly half of a signed-in customer's orders contain something they later
    reviewed. The Review table has no link back to an order, so the only way a
    review can be trustworthy is if the order lines happen to agree, and they do
    because the generator reads the review list.
  - Totals are always items + shipping - discount, and the money is recomputed from
    live product prices in prisma/seed.ts rather than written here, so an order
    can never disagree with its own lines.

  Everything is generated from a fixed seed, so re-running the seed produces the
  same thirty orders instead of a fresh scatter each time.
*/

import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FEE_CENTS,
} from "../../src/lib/constants";
import { generateOrderNumber } from "../../src/lib/utils";
import type { SeedProduct } from "./products";
import type { SeedReview } from "./reviews";
import { CUSTOMERS, GUESTS } from "./users";

export const ORDER_COUNT = 30;
export const ORDER_WINDOW_DAYS = 60;

/**
 * Where the running sequence starts, so the shop looks established rather than like
 * it took its first order this morning. The numbers are formatted by the same helper
 * the app uses at checkout.
 */
const FIRST_ORDER_SEQUENCE = 10042;

/** Baskets at or above this are the ones a customer bothers typing a code into. */
const PROMO_MIN_SUBTOTAL_CENTS = 4000;
const PROMO_PERCENT = 10;

/** Roughly one order in three is placed without an account. */
const GUEST_ORDER_RATIO = 0.3;

/**
 * How many of the thirty orders land on a day that already has one, creating the
 * spikes a revenue chart needs and leaving five quiet days with none.
 */
const CLUSTERED_ORDERS = 5;

/** Weekdays in busyness order, so the second order lands Saturday first. */
const BUSIEST_FIRST = [6, 0, 5, 4, 1, 2, 3] as const;

/** Growth across the window: the oldest day weighs 0.8, today weighs 1.25. */
const RECENCY_FLOOR = 0.8;
const RECENCY_SPAN = 0.45;

export type SeedOrderStatus =
  | "PENDING"
  | "PAID"
  | "FULFILLED"
  | "CANCELLED"
  | "REFUNDED";

export type SeedOrder = {
  orderNumber: string;
  email: string;
  /** Set for a signed-in customer, null for guest checkout. */
  accountEmail: string | null;
  shipTo: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: SeedOrderStatus;
  paymentMethod: "STRIPE" | "COD";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  items: { sku: string; quantity: number }[];
  discountCents: number;
  shippingCents: number;
  trackingNumber: string | null;
  /** Whole days before today. */
  daysAgo: number;
  /** Local hour and minute, so two orders on one day are still distinguishable. */
  hour: number;
  minute: number;
};

/**
 * Deterministic pseudo-random generator. A fixed seed means the seeded order list
 * is the same on every machine, which is what makes "seed twice, get the same
 * database" a checkable claim rather than a hope.
 */
function mulberry32(seed: number): () => number {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How busy a day is, by weekday. Saturday is the trade on; Tuesday is not. */
const DAY_WEIGHT: Record<number, number> = {
  0: 1.7, // Sunday
  1: 0.8, // Monday
  2: 0.6, // Tuesday
  3: 0.7, // Wednesday
  4: 0.9, // Thursday
  5: 1.2, // Friday
  6: 2.4, // Saturday
};

type WeightedDay = { offset: number; weight: number; share: number };

/** A date offset days from today, at midday. */
function dateForOffset(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return date;
}

const byHeaviest = (a: WeightedDay, b: WeightedDay) =>
  b.weight - a.weight || a.offset - b.offset;

/**
 * Shares out the thirty orders across the sixty-day window.
 *
 * Rather than sampling at random and hoping the shape comes out right, every day is
 * given a share up front: floor the weighted expectation, then hand the rounding
 * remainder out largest-first. "Busier at the weekend, busier recently" is a
 * property of the data rather than something that happened to occur, because a
 * sampled version of the same idea drifts by two or three orders on a sample this
 * small, which is enough to make a chart look wrong. The recency term, running from
 * RECENCY_FLOOR to RECENCY_FLOOR + RECENCY_SPAN, is the growth trend.
 *
 * Plain largest-remainder still leaves one order on thirty of the thirty distinct
 * days, because thirty orders across sixty days averages out at half an order a
 * day. So the second step deliberately moves CLUSTERED_ORDERS of them: the busiest
 * day of each weekday, in busyness order, picks up a second order, and gives are
 * taken from the most recent quiet days. Taking them from the busiest day only
 * would put fourteen orders on nine Saturdays, which is a market stall. Taking them
 * from the *oldest* quiet days would quietly double the apparent growth trend, so
 * the givers are recent as well and the shape survives the move intact.
 */
function allocateDays(count: number): WeightedDay[] {
  const days: WeightedDay[] = [];
  let totalWeight = 0;

  for (let offset = 0; offset < ORDER_WINDOW_DAYS; offset += 1) {
    const recency = RECENCY_FLOOR + (1 - offset / ORDER_WINDOW_DAYS) * RECENCY_SPAN;
    const weight = (DAY_WEIGHT[dateForOffset(offset).getDay()] ?? 1) * recency;

    totalWeight += weight;
    days.push({ offset, weight, share: 0 });
  }

  let assigned = 0;

  for (const day of days) {
    day.share = Math.floor((day.weight / totalWeight) * count);
    assigned += day.share;
  }

  const leftovers = days
    .map((day) => ({
      day,
      remainder: (day.weight / totalWeight) * count - day.share,
    }))
    .sort((a, b) => b.remainder - a.remainder || a.day.offset - b.day.offset);

  for (let index = 0; index < count - assigned; index += 1) {
    leftovers[index].day.share += 1;
  }

  const allocated = days.filter((day) => day.share > 0);
  const receivers = new Set<WeightedDay>();

  for (const weekday of BUSIEST_FIRST) {
    const busiest = allocated
      .filter((day) => dateForOffset(day.offset).getDay() === weekday)
      .sort(byHeaviest)[0];

    if (busiest) receivers.add(busiest);
    if (receivers.size === CLUSTERED_ORDERS) break;
  }

  const givers = allocated
    .filter((day) => !receivers.has(day))
    .sort((a, b) => a.offset - b.offset);

  for (const receiver of receivers) {
    const giver = givers.find((day) => day.share > 0);
    if (!giver) break;

    giver.share -= 1;
    receiver.share += 1;
  }

  return days;
}

/**
 * One offset per order, shuffled.
 *
 * The allocation walks the window in date order, which would otherwise hand the
 * first few customers in the file a suspiciously tidy run of orders.
 */
function dayOffsets(random: () => number, count: number): number[] {
  const offsets: number[] = [];

  for (const day of allocateDays(count)) {
    for (let copy = 0; copy < day.share; copy += 1) {
      offsets.push(day.offset);
    }
  }

  for (let index = offsets.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = offsets[index];
    offsets[index] = offsets[swap];
    offsets[swap] = held;
  }

  return offsets;
}

/** Statuses follow the age of the order, with a little jitter inside each band. */
function statusFor(daysAgo: number, random: () => number): SeedOrderStatus {
  if (daysAgo <= 2) return random() < 0.45 ? "PENDING" : "PAID";
  if (daysAgo <= 9) return random() < 0.5 ? "PAID" : "PENDING";
  if (daysAgo <= 16) return random() < 0.55 ? "FULFILLED" : "PAID";
  return "FULFILLED";
}

/** A UPS-style tracking number: 1Z, two letters, then nine digits. */
function trackingNumber(random: () => number): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const pick = () => letters[Math.floor(random() * letters.length)];
  let digits = "";

  for (let index = 0; index < 9; index += 1) {
    digits += Math.floor(random() * 10);
  }

  return `1Z${pick()}${pick()}${digits}`;
}

/**
 * Which orders are guest checkout, decided as an exact split rather than by
 * chance. Thirty coin flips landing four of them on guest checkout would be within
 * the odds but would leave the guest path thin, and the ratio is a thing worth
 * stating plainly.
 */
function guestFlags(random: () => number, count: number): boolean[] {
  const guestCount = Math.round(count * GUEST_ORDER_RATIO);
  const flags = [
    ...Array<boolean>(guestCount).fill(true),
    ...Array<boolean>(count - guestCount).fill(false),
  ];

  for (let index = flags.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = flags[index];
    flags[index] = flags[swap];
    flags[swap] = held;
  }

  return flags;
}

/**
 * Builds the sku-to-reviewers index the generator uses to keep orders and reviews
 * telling the same story. Only approved reviews count: nobody has verified a
 * purchase they have not made.
 */
function reviewsBySku(reviews: SeedReview[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();

  for (const review of reviews) {
    if (!review.approved) continue;

    const reviewers = index.get(review.sku) ?? new Set<string>();
    reviewers.add(review.customer);
    index.set(review.sku, reviewers);
  }

  return index;
}

export function generateOrders(
  products: SeedProduct[],
  reviews: SeedReview[],
): SeedOrder[] {
  const random = mulberry32(20260505);
  const offsets = dayOffsets(random, ORDER_COUNT);
  const isGuest = guestFlags(random, ORDER_COUNT);
  const reviewedBy = reviewsBySku(reviews);
  const drafts: Omit<SeedOrder, "orderNumber">[] = [];

  offsets.forEach((daysAgo, index) => {
    const account = isGuest[index]
      ? null
      : CUSTOMERS[Math.floor(random() * CUSTOMERS.length)];
    const guest = account ? null : GUESTS[Math.floor(random() * GUESTS.length)];
    const shipFrom = account ?? guest;

    if (!shipFrom) return;

    // One to three lines, each one or two units. Big baskets are the exception.
    const lineCount = 1 + Math.floor(random() * 3);
    const usedSkus = new Set<string>();
    const items: { sku: string; quantity: number }[] = [];

    // Favour things this customer went on to review, so the orders table and the
    // reviews table agree with each other. Not exclusively, because a returning
    // customer also buys things they never bothers to write about.
    const reviewed = account
      ? products.filter((product) => reviewedBy.get(product.sku)?.has(account.email))
      : [];

    // The first line is almost always something this customer went on to review,
    // so the orders and the reviews agree with each other; later lines are a
    // coin flip, because people also buy things they never write about.
    const takeReviewed = (): void => {
      if (reviewed.length === 0) return;

      // Prefer something not already in this basket, so one customer does not
      // buy the same plant three times across three orders.
      const available = reviewed.filter((product) => !usedSkus.has(product.sku));
      if (available.length === 0) return;

      const product = available[Math.floor(random() * available.length)];
      usedSkus.add(product.sku);
      items.push({ sku: product.sku, quantity: 1 });
    };

    takeReviewed();

    while (items.length < lineCount) {
      if (items.length > 0 && random() < 0.5) {
        takeReviewed();
        continue;
      }

      const product = products[Math.floor(random() * products.length)];
      if (usedSkus.has(product.sku)) continue;

      usedSkus.add(product.sku);
      items.push({ sku: product.sku, quantity: random() < 0.78 ? 1 : 2 });
    }

    const subtotalCents = items.reduce((sum, item) => {
      const product = products.find((entry) => entry.sku === item.sku);
      const unit = product?.salePriceCents ?? product?.priceCents ?? 0;
      return sum + unit * item.quantity;
    }, 0);

    // Cash on delivery is a minority choice, because most people would rather not
    // have a driver ring them.
    const paymentMethod: SeedOrder["paymentMethod"] =
      random() < 0.82 ? "STRIPE" : "COD";
    const status = statusFor(daysAgo, random);
    const usesPromo =
      subtotalCents >= PROMO_MIN_SUBTOTAL_CENTS && random() < 0.4;
    const discountCents = usesPromo
      ? Math.round((subtotalCents * PROMO_PERCENT) / 100)
      : 0;

    drafts.push({
      email: shipFrom.email,
      accountEmail: account?.email ?? null,
      shipTo: {
        fullName: shipFrom.name,
        phone: shipFrom.phone,
        ...shipFrom.address,
      },
      status,
      paymentMethod,
      paymentStatus: status === "PENDING" ? "PENDING" : "PAID",
      items,
      discountCents,
      // Quoted against the discounted subtotal, which is what calculateTotals()
      // does at checkout. Quoting against the pre-discount total would make a
      // seeded order and a real one disagree about who paid for shipping.
      shippingCents:
        subtotalCents - discountCents >= FREE_SHIPPING_THRESHOLD_CENTS
          ? 0
          : SHIPPING_FEE_CENTS,
      trackingNumber: status === "FULFILLED" ? trackingNumber(random) : null,
      daysAgo,
      // Trading hours with a lunch bump, because a plant shop is not a website.
      hour: 9 + Math.floor(random() * 11),
      minute: Math.floor(random() * 60),
    });
  });

  // Exactly one cancelled order: the newest pending one, which is the shape a
  // declined card takes in a real list. Nothing was taken, so nothing shipped.
  const newestPending = drafts
    .filter((order) => order.status === "PENDING")
    .sort((a, b) => a.daysAgo - b.daysAgo)[0];

  if (newestPending) {
    newestPending.status = "CANCELLED";
    newestPending.paymentStatus = "FAILED";
    newestPending.trackingNumber = null;
  }

  // Exactly one refund: a fulfilled order old enough to have been delivered and
  // then sent back, so it has to be at least three weeks old.
  const refundable = drafts
    .filter((order) => order.status === "FULFILLED" && order.daysAgo >= 21)
    .sort((a, b) => a.daysAgo - b.daysAgo)[0];

  if (refundable) {
    refundable.status = "REFUNDED";
    refundable.paymentStatus = "REFUNDED";
  }

  // Oldest first, so order numbers climb with the calendar the way a real running
  // sequence does.
  drafts.sort((a, b) => b.daysAgo - a.daysAgo);

  return drafts.map((order, index) => ({
    ...order,
    orderNumber: generateOrderNumber(FIRST_ORDER_SEQUENCE + index),
  }));
}
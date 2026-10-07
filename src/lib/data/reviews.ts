import "server-only";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/*
  Review queries.

  Only approved reviews are ever returned. That filter lives in the query rather
  than in the component, so an unapproved review cannot leak into a page by
  forgetting a check somewhere in a list.
*/

export type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  createdAtLabel: string;
};

export type ReviewSummary = {
  average: number;
  /** Star counts indexed 1-5, so a histogram can be rendered without regrouping. */
  distribution: { rating: number; count: number; percent: number }[];
  total: number;
  /** Percentage of 4- and 5-star reviews, the number shoppers actually look for. */
  positivePercent: number;
};

const REVIEW_SELECT = {
  id: true,
  userId: true,
  rating: true,
  title: true,
  body: true,
  createdAt: true,
  user: { select: { name: true } },
  product: { select: { id: true } },
} as const;

/**
 * Who genuinely bought a product.
 *
 * A Review row has no link back to an order, so "verified" is resolved by asking
 * the order lines rather than trusting a flag: a customer counts as verified for a
 * product when they have an order line on an order that has left the bench
 * (confirmed, shipped or delivered). Cancelled orders do not count, because
 * nobody received the plant.
 */
async function getVerifiedBuyerIds(
  productId: string,
): Promise<ReadonlySet<string>> {
  const lines = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
        userId: { not: null },
      },
    },
    select: { order: { select: { userId: true } } },
  });

  const ids = new Set<string>();

  for (const line of lines) {
    if (line.order.userId) ids.add(line.order.userId);
  }

  return ids;
}

function toItem(
  row: {
    id: string;
    userId: string;
    rating: number;
    title: string;
    body: string;
    createdAt: Date;
    user: { name: string };
  },
  verifiedUserIds: ReadonlySet<string>,
): ReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: row.user.name,
    verifiedPurchase: verifiedUserIds.has(row.userId),
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: formatDate(row.createdAt),
  };
}

/** Approved reviews for a product, newest first. */
export async function getReviewsByProduct(
  productId: string,
  limit = 20,
): Promise<ReviewItem[]> {
  const [rows, verifiedUserIds] = await Promise.all([
    prisma.review.findMany({
      where: { productId, approved: true },
      select: REVIEW_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    getVerifiedBuyerIds(productId),
  ]);

  return rows.map((row) => toItem(row, verifiedUserIds));
}

/** The newest approved reviews from across the shop, for the home page strip. */
export async function getLatestReviews(
  limit = 6,
): Promise<(ReviewItem & { productName: string; productSlug: string })[]> {
  const rows = await prisma.review.findMany({
    where: { approved: true },
    select: {
      ...REVIEW_SELECT,
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    distinct: ["productId"],
  });

  // `distinct` runs in SQL, so the rows come back with their product already
  // resolved and the badge is filled in per product.
  const verifiedByProduct = new Map<string, ReadonlySet<string>>();

  await Promise.all(
    rows.map(async (row) => {
      if (!verifiedByProduct.has(row.product.id)) {
        verifiedByProduct.set(
          row.product.id,
          await getVerifiedBuyerIds(row.product.id),
        );
      }
    }),
  );

  return rows.map((row) => ({
    ...toItem(row, verifiedByProduct.get(row.product.id) ?? new Set()),
    productName: row.product.name,
    productSlug: row.product.slug,
  }));
}

/**
 * Rating average and histogram for a product.
 *
 * The histogram is always five entries long, including zeroes, so a chart does
 * not have to guess at the buckets it was not given.
 */
export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const group = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, approved: true },
    _count: { rating: true },
    _sum: { rating: true },
  });

  const total = group.reduce((sum, row) => sum + row._count.rating, 0);
  const weighted = group.reduce(
    (sum, row) => sum + (row._sum.rating ?? 0) * row._count.rating,
    0,
  );

  const counts = new Map(
    group.map((row) => [row.rating, row._count.rating] as const),
  );

  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = counts.get(rating) ?? 0;
    return {
      rating,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });

  const positiveCount = (counts.get(5) ?? 0) + (counts.get(4) ?? 0);

  return {
    average: total === 0 ? 0 : Math.round((weighted / total) * 10) / 10,
    distribution,
    total,
    positivePercent: total === 0 ? 0 : Math.round((positiveCount / total) * 100),
  };
}

/** A customer's own reviews, including ones still awaiting moderation. */

/** Reviews waiting for a moderator, oldest first so nothing sits forever. */
export async function getPendingReviews(
  limit = 20,
): Promise<
  (ReviewItem & { approved: boolean; productName: string; productSlug: string })[]
> {
  const rows = await prisma.review.findMany({
    where: { approved: false },
    select: {
      ...REVIEW_SELECT,
      approved: true,
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  // Everything in this queue is unapproved, so nobody here can be a verified
  // buyer until a moderator publishes it.
  const nobody = new Set<string>();

  return rows.map((row) => ({
    ...toItem(row, nobody),
    approved: row.approved,
    productName: row.product.name,
    productSlug: row.product.slug,
  }));
}

export type ReviewFormState = {
  /** Whether this customer has a paid or fulfilled order line for the product. */
  eligible: boolean;
  /** Their existing review, whatever its approval state — one per customer. */
  existing: {
    rating: number;
    title: string;
    body: string;
    approved: boolean;
  } | null;
};

/**
 * Everything the "write a review" widget needs to know about this customer.
 *
 * Eligibility is decided the same way verified-buyer badges are: an order line
 * for the product on an order that has left the bench (confirmed, shipped or
 * delivered). A pending or cancelled order does not count, because nobody has
 * received the plant to judge it.
 */
export async function getReviewFormState(
  productId: string,
  userId: string,
): Promise<ReviewFormState> {
  const [existing, purchasedLines] = await Promise.all([
    prisma.review.findFirst({
      where: { productId, userId },
      select: { rating: true, title: true, body: true, approved: true },
    }),
    prisma.orderItem.count({
      where: {
        productId,
        order: { userId, status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] } },
      },
    }),
  ]);

  return {
    eligible: purchasedLines > 0,
    existing,
  };
}

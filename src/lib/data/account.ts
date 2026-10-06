import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrders, type OrderSummary } from "@/lib/data/orders";
import { getWishlistProductIds } from "@/lib/data/users";
import { formatDate } from "@/lib/utils";

/*
  Customer-facing account queries.

  These compose the existing order and user queries into the shapes the account
  pages need. Everything here takes the caller's `userId` from the session — the
  pages never read the id off the request — so the overview cannot be fetched for
  someone else's cookie and a reorder can only name one of your own orders.
*/

export type AccountOverview = {
  name: string;
  email: string;
  memberSinceLabel: string;
  orderCount: number;
  latestOrders: OrderSummary[];
  addressCount: number;
  wishlistCount: number;
};

/** Everything the Overview page shows, in one round trip where possible. */
export async function getAccountOverview(
  userId: string,
): Promise<AccountOverview | null> {
  const [user, addressCount, wishlistCount, orderCount, orders] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, createdAt: true },
      }),
      prisma.address.count({ where: { userId } }),
      getWishlistProductIds(userId),
      prisma.order.count({ where: { userId } }),
      getOrders({ userId, limit: 3 }),
    ]);

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    memberSinceLabel: formatDate(user.createdAt),
    orderCount,
    latestOrders: orders,
    addressCount,
    wishlistCount: wishlistCount.length,
  };
}

export type ReorderLine = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  stock: number;
};

/**
 * The shopping-list half of "order it again".
 *
 * Only lines whose product is still active and still in stock come back — an
 * order containing something retired becomes a basket with what it *can* still
 * buy, and the caller reports how many lines were left out so the customer is
 * told rather than left wondering. Quantities are clamped to the current stock
 * and to the basket's 99 ceiling, and prices are today's, because an old order
 * is a memory and the basket is a promise to charge the current one.
 */
export async function getReorderLines(
  orderId: string,
  userId: string,
): Promise<{ lines: ReorderLine[]; skipped: number }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      items: {
        where: { productId: { not: null } },
        select: { productId: true, quantity: true },
      },
    },
  });

  if (!order) return { lines: [], skipped: 0 };

  const productIds = order.items.flatMap((item) =>
    item.productId ? [item.productId] : [],
  );

  if (productIds.length === 0) return { lines: [], skipped: 0 };

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, stock: { gt: 0 } },
    select: {
      id: true,
      slug: true,
      name: true,
      priceCents: true,
      stock: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: ReorderLine[] = [];
  let skipped = 0;

  for (const item of order.items) {
    const product = item.productId ? byId.get(item.productId) : undefined;

    if (!product) {
      skipped += 1;
      continue;
    }

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      image: product.images[0]?.url ?? null,
      quantity: Math.min(item.quantity, product.stock, 99),
      stock: product.stock,
    });
  }

  return { lines, skipped };
}
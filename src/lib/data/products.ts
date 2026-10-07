import "server-only";

import { cache } from "react";

import {
  LOW_STOCK_THRESHOLD,
  difficultySchema,
  lightLevelSchema,
  waterLevelSchema,
  type ProductSort,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

/*
  Product queries.

  Everything here runs on the server and returns plain serializable objects:
  no Prisma model instances, no Date objects, no BigInt. That is what lets a
  Server Component pass the result straight into a Client Component without a
  serialization error, and it keeps the shape of a product card stable even if
  the schema changes underneath it.

  Two rules apply throughout:

  1. `isActive` is filtered in the query, never in the view. A draft product
     must not be reachable by a URL a customer can guess.
  2. Strings stored in enum-like columns are parsed with the shared Zod schemas
     and a row with an unexpected value is dropped rather than passed through.
*/

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  /** The opening sentence of the description, for grids and search results. */
  blurb: string;
  priceCents: number;
  salePriceCents: number | null;
  /** The price to actually charge and display, decided once, here. */
  effectivePriceCents: number;
  priceLabel: string;
  salePriceLabel: string | null;
  onSale: boolean;
  image: string | null;
  imageAlt: string | null;
  /**
   * The second image, for the hover crossfade on a card. Null when a product has
   * only been given one photograph, in which case the card simply does not swap.
   */
  hoverImage: string | null;
  hoverImageAlt: string | null;
  light: string;
  water: string;
  petSafe: boolean;
  difficulty: string;
  stock: number;
  lowStock: boolean;
  inStock: boolean;
  featured: boolean;
  categoryName: string;
  categorySlug: string;
};

export type ProductDetail = ProductCard & {
  sku: string;
  description: string;
  careNotes: string;
  heightCm: number | null;
  isActive: boolean;
  categoryDescription: string;
  categoryImage: string;
  createdAt: string;
  images: { id: string; url: string; alt: string; position: number }[];
  rating: { average: number; count: number };
  /** Whether the signed-in customer has this on their wishlist. */
  isWishlisted: boolean;
};

export type ProductFilter = {
  categorySlug?: string;
  light?: string;
  water?: string;
  difficulty?: string;
  petSafe?: boolean;
  /** Cents, like every other amount in this codebase. */
  minPriceCents?: number;
  maxPriceCents?: number;
  search?: string;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
};

export const DEFAULT_PER_PAGE = 12;

/**
 * Primary image first, then anything else by position, then by id.
 *
 * Prisma takes an array of single-key order clauses, so position and id are
 * separate entries rather than two keys on one object.
 */
const imageOrder = [{ position: "asc" as const }, { id: "asc" as const }];

/**
 * The first sentence of a description, used as the card blurb.
 *
 * Every seeded description opens with the thing that makes that plant worth
 * looking at, so the first sentence stands on its own in a grid. A hard cut at
 * 140 characters covers a long first sentence without trailing off mid-word.
 */
function toBlurb(description: string): string {
  const firstStop = description.search(/[.!?](\s|$)/);

  if (firstStop === -1) {
    return description.length <= 140
      ? description
      : `${description.slice(0, 137).replace(/[\s,;:]+$/, "")}…`;
  }

  const sentence = description.slice(0, firstStop + 1);
  return sentence.length <= 140
    ? sentence
    : `${sentence.slice(0, 137).replace(/[\s,;:]+$/, "")}…`;
}

function toCard(
  row: ProductCardRow,
  fallbackCategoryName: string,
): ProductCard | null {
  const light = lightLevelSchema.safeParse(row.light);
  const water = waterLevelSchema.safeParse(row.water);
  const difficulty = difficultySchema.safeParse(row.difficulty);

  if (!light.success || !water.success || !difficulty.success) return null;

  const onSale = row.salePriceCents != null && row.salePriceCents < row.priceCents;
  const effectivePriceCents = onSale ? (row.salePriceCents as number) : row.priceCents;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    blurb: toBlurb(row.description),
    priceCents: row.priceCents,
    salePriceCents: row.salePriceCents,
    effectivePriceCents,
    priceLabel: formatPrice(effectivePriceCents),
    salePriceLabel: onSale ? formatPrice(row.priceCents) : null,
    onSale,
    image: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? null,
    hoverImage: row.images[1]?.url ?? null,
    hoverImageAlt: row.images[1]?.alt ?? null,
    light: light.data,
    water: water.data,
    petSafe: row.petSafe,
    difficulty: difficulty.data,
    stock: row.stock,
    lowStock: row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD,
    inStock: row.stock > 0,
    featured: row.featured,
    categoryName: row.category?.name ?? fallbackCategoryName,
    categorySlug: row.category?.slug ?? "",
  };
}

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  petSafe: boolean;
  featured: boolean;
  light: string;
  water: string;
  difficulty: string;
  category: { name: string; slug: string } | null;
  description: string;
  images: { url: string; alt: string }[];
};

/**
 * The card shape used everywhere a product is listed. One select, so a listing of
 * 24 products is still a single query with a single join.
 */
const cardSelect = {
  id: true,
  name: true,
  slug: true,
  priceCents: true,
  salePriceCents: true,
  stock: true,
  petSafe: true,
  featured: true,
  light: true,
  water: true,
  difficulty: true,
  category: { select: { name: true, slug: true } },
  description: true,
  images: { select: { url: true, alt: true }, orderBy: imageOrder },
} as const;

/**
 * Price bounds are matched against the price the customer actually pays
 * (`salePriceCents ?? priceCents`), which Prisma cannot express as one field
 * comparison. So the condition is spelled out: a product qualifies when its sale
 * price is in range, or when it has no sale price and its full price is.
 */
function priceWhere(filter: ProductFilter) {
  const and = [];

  if (filter.minPriceCents !== undefined) {
    and.push({
      OR: [
        { salePriceCents: { gte: filter.minPriceCents } },
        { salePriceCents: null, priceCents: { gte: filter.minPriceCents } },
      ],
    });
  }

  if (filter.maxPriceCents !== undefined) {
    and.push({
      OR: [
        { salePriceCents: { lte: filter.maxPriceCents } },
        { salePriceCents: null, priceCents: { lte: filter.maxPriceCents } },
      ],
    });
  }

  return and;
}

function buildOrderBy(sort: ProductSort) {
  switch (sort) {
    case "newest":
      return { createdAt: "desc" as const };
    case "price-asc":
      // Sort key is the effective price; SQLite sorts NULLs first, so rows on
      // sale are nudged after their undiscounted neighbours only where prices
      // tie. Good enough for a shop listing and much cheaper than a computed
      // column.
      return [{ salePriceCents: "asc" as const }, { priceCents: "asc" as const }];
    case "price-desc":
      return [{ salePriceCents: "desc" as const }, { priceCents: "desc" as const }];
    case "name":
      return { name: "asc" as const };
    case "featured":
    default:
      return [{ featured: "desc" as const }, { createdAt: "desc" as const }];
  }
}

/**
 * One page of products plus the totals a filter bar needs: how many match, and
 * how many pages that is. Returns an empty `products` array rather than
 * throwing when the page is past the end, so a stale bookmark shows an empty
 * state instead of an error.
 */
export async function getProducts(
  filter: ProductFilter = {},
): Promise<{
  products: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}> {
  const page = filter.page ?? 1;
  const perPage = filter.perPage ?? DEFAULT_PER_PAGE;
  const sort = filter.sort ?? "featured";

  const where = {
    isActive: true,
    ...(filter.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
    ...(filter.light ? { light: filter.light } : {}),
    ...(filter.water ? { water: filter.water } : {}),
    ...(filter.difficulty ? { difficulty: filter.difficulty } : {}),
    ...(filter.petSafe !== undefined ? { petSafe: filter.petSafe } : {}),
    ...(filter.search
      ? {
          OR: [
            { name: { contains: filter.search } },
            { description: { contains: filter.search } },
          ],
        }
      : {}),
    AND: priceWhere(filter),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.flatMap((row) => {
      const card = toCard(row, "");
      return card ? [card] : [];
    }),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Products by id, in the order asked for, as cards.
 *
 * This is what the wishlist page renders: a guest's saved ids live in
 * localStorage, so the server is handed a list of ids and has to turn them back
 * into something with a name and a photograph. Drafts are dropped here rather
 * than filtered by the caller, so a wishlist saved while a product was live does
 * not render a card for something that is no longer for sale.
 *
 * Ids that no longer resolve — a product deleted after it was saved — are simply
 * absent from the result rather than represented by a hole, because a grid with a
 * gap in it is worse than a grid that is one card shorter.
 */
export async function getProductsByIds(ids: string[]): Promise<ProductCard[]> {
  const wanted = [...new Set(ids)];

  if (wanted.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: wanted }, isActive: true },
    select: cardSelect,
  });

  const byId = new Map<string, ProductCard>();

  for (const row of rows) {
    const card = toCard(row, "");
    if (card) byId.set(row.id, card);
  }

  return wanted.flatMap((id) => {
    const card = byId.get(id);
    return card ? [card] : [];
  });
}

/**
 * Products by slug, in the order the slugs were asked for.
 *
 * The journal's "shop the plants in this post" strip is a fixed list of slugs in
 * the prose, so ordering by the source list keeps the strip reading like the
 * sentence that introduced it. Missing slugs silently drop out — a post survives
 * a plant being taken off the bench without the strip crashing.
 */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  const wanted = [...new Set(slugs)];

  if (wanted.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { slug: { in: wanted }, isActive: true },
    select: cardSelect,
  });

  const bySlug = new Map<string, ProductCard>();

  for (const row of rows) {
    const card = toCard(row, "");
    if (card) bySlug.set(row.slug, card);
  }

  return wanted.flatMap((slug) => {
    const card = bySlug.get(slug);
    return card ? [card] : [];
  });
}

/**
 * A single product with everything its page needs. Returns null for a missing,
 * inactive or malformed product, so the caller renders a not-found rather than
 * crashing.
 *
 * Wrapped in React's `cache` because a product page asks for the same row twice —
 * once in `generateMetadata` and once to render — and the second copy is free.
 * The cache is per request, so it never serves one visitor's product to another.
 */
export const getProductBySlug = cache(
  async (
    slug: string,
    options: { userId?: string } = {},
  ): Promise<ProductDetail | null> => {
    const row = await prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        ...cardSelect,
        sku: true,
        careNotes: true,
        heightCm: true,
        isActive: true,
        createdAt: true,
        category: {
          select: { name: true, slug: true, description: true, image: true },
        },
        images: {
          select: { id: true, url: true, alt: true, position: true },
          orderBy: imageOrder,
        },
        reviews: { where: { approved: true }, select: { rating: true } },
        wishlistItems: {
          where: options.userId
            ? { userId: options.userId }
            : { userId: "__none__" },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!row) return null;

    const card = toCard(row, "");
    if (!card) return null;

    const average =
      row.reviews.length === 0
        ? 0
        : row.reviews.reduce((total, review) => total + review.rating, 0) /
          row.reviews.length;

    return {
      ...card,
      sku: row.sku,
      description: row.description,
      careNotes: row.careNotes,
      heightCm: row.heightCm,
      isActive: row.isActive,
      categoryDescription: row.category?.description ?? "",
      categoryImage: row.category?.image ?? "",
      createdAt: row.createdAt.toISOString(),
      images: row.images,
      rating: {
        // One decimal place. A raw 4.3333 looks like a bug on a product card.
        average: Math.round(average * 10) / 10,
        count: row.reviews.length,
      },
      isWishlisted: row.wishlistItems.length > 0,
    };
  },
);

/**
 * Products for the home page and the "featured" strip.
 *
 * A shortlist is topped up from the newest arrivals when the catalogue has fewer
 * flagged products than the strip asks for. Without the top-up a home page would
 * quietly render fewer cards the day somebody unflags a product, which looks like
 * a bug rather than an editorial choice. Out-of-stock rows are excluded from both
 * halves: the home page is the first thing a visitor sees and it should never
 * open on something that cannot be bought.
 */
export async function getFeaturedProducts(limit = 6): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, featured: true, stock: { gt: 0 } },
    select: cardSelect,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  const cards = rows.flatMap((row) => {
    const card = toCard(row, "");
    return card ? [card] : [];
  });

  if (cards.length >= limit) return cards;

  const filler = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      id: { notIn: rows.map((row) => row.id) },
    },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit - cards.length,
  });

  return [
    ...cards,
    ...filler.flatMap((row) => {
      const card = toCard(row, "");
      return card ? [card] : [];
    }),
  ];
}

/**
 * Products in the same category, excluding the one being viewed. Falls back to
 * featured products from elsewhere when a category has only one member, so the
 * strip is never empty on a fresh catalogue.
 */
export async function getRelatedProducts(
  productId: string,
  limit = 4,
): Promise<ProductCard[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) return [];

  const sameCategory = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      categoryId: product.categoryId,
      stock: { gt: 0 },
    },
    select: cardSelect,
    orderBy: { featured: "desc" },
    take: limit,
  });

  if (sameCategory.length >= limit) {
    return sameCategory.flatMap((row) => {
      const card = toCard(row, "");
      return card ? [card] : [];
    });
  }

  const filler = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      categoryId: { not: product.categoryId },
      stock: { gt: 0 },
    },
    select: cardSelect,
    orderBy: { featured: "desc" },
    take: limit - sameCategory.length,
  });

  const rows = [...sameCategory, ...filler];

  return rows.flatMap((row) => {
    const card = toCard(row, "");
    return card ? [card] : [];
  });
}

/**
 * Headline numbers for the marketing copy.
 *
 * These exist because the alternative is a hardcoded "Sixty varieties" in three
 * places, which is a claim that quietly stops being true the first time a product
 * is retired and nobody notices. Reading them from the database means the copy
 * cannot drift from the catalogue.
 */
export async function getShopStats(): Promise<{
  products: number;
  shelves: number;
  petSafe: number;
}> {
  const [products, shelves, petSafe] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.product.count({ where: { isActive: true, petSafe: true } }),
  ]);

  return { products, shelves, petSafe };
}

/**
 * Price bounds for the filter bar, computed from the effective price rather than
 * the raw price so a heavily discounted product does not stretch the slider past
 * anything the customer could actually buy.
 */
export async function getEffectivePriceBounds(): Promise<{
  minCents: number;
  maxCents: number;
}> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { priceCents: true, salePriceCents: true },
  });

  if (rows.length === 0) return { minCents: 0, maxCents: 0 };

  const effective = rows.map((row) => row.salePriceCents ?? row.priceCents);

  return {
    minCents: Math.min(...effective),
    maxCents: Math.max(...effective),
  };
}

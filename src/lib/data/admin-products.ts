import "server-only";

import {
  difficultySchema,
  lightLevelSchema,
  LOW_STOCK_THRESHOLD,
  waterLevelSchema,
  type Difficulty,
  type LightLevel,
  type WaterLevel,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

/*
  Admin product queries.

  The storefront's product queries in /products.ts filter `isActive` in the query
  and return card shapes. These are the back-office counterparts: they see
  drafts, return flat serialisable rows for a table, and never let a caller
  forget that money is cents and stock is units.
*/

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  priceLabel: string;
  salePriceCents: number | null;
  salePriceLabel: string | null;
  onSale: boolean;
  stock: number;
  lowStock: boolean;
  outOfStock: boolean;
  isActive: boolean;
  featured: boolean;
  categoryId: string;
  categoryName: string;
  image: string | null;
  imageAlt: string | null;
  imageCount: number;
  /** Whether any order line has ever pointed at this product — delete decides
      between a hard delete and taking it off the shelf because of this. */
  hasOrders: boolean;
  createdAt: string;
};

export type AdminProductsPage = {
  rows: AdminProductRow[];
  total: number;
  pageCount: number;
};

export const ADMIN_PRODUCTS_PER_PAGE = 10;

export type AdminProductSort = "newest" | "name" | "price" | "stock";
export type SortDir = "asc" | "desc";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  isActive: boolean;
  featured: boolean;
  categoryId: string;
  createdAt: Date;
  category: { name: string };
  images: { url: string; alt: string }[];
  _count: { orderItems: number };
};

function toRow(row: ProductRow): AdminProductRow {
  const onSale =
    row.salePriceCents != null && row.salePriceCents < row.priceCents;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    priceCents: row.priceCents,
    priceLabel: formatPrice(row.priceCents),
    salePriceCents: onSale ? row.salePriceCents : null,
    salePriceLabel: onSale ? formatPrice(row.salePriceCents as number) : null,
    onSale,
    stock: row.stock,
    lowStock: row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD,
    outOfStock: row.stock === 0,
    isActive: row.isActive,
    featured: row.featured,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    image: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? null,
    imageCount: row.images.length,
    hasOrders: row._count.orderItems > 0,
    createdAt: row.createdAt.toISOString(),
  };
}

const imageOrder = [{ position: "asc" as const }, { id: "asc" as const }];

const productSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  priceCents: true,
  salePriceCents: true,
  stock: true,
  isActive: true,
  featured: true,
  categoryId: true,
  createdAt: true,
  category: { select: { name: true } },
  images: {
    select: { url: true, alt: true },
    orderBy: imageOrder,
  },
  _count: { select: { orderItems: true } },
} as const;

/**
 * One page of the catalogue, with the filters the desk needs: a text search,
 * a category, whether it is on the shelf, and how the shelf is doing.
 *
 * Stock is a derived filter rather than a column, because "low" is a business
 * rule (LOW_STOCK_THRESHOLD) that happens to be expressible in SQL — but the
 * rule lives in constants, so the filter is spelled out against it rather than
 * hardcoded to a number that would drift.
 */
export async function getAdminProducts(options: {
  q?: string;
  categoryId?: string;
  status?: "active" | "draft" | "all";
  stock?: "in" | "low" | "out" | "all";
  page: number;
  sort: AdminProductSort;
  dir: SortDir;
}): Promise<AdminProductsPage> {
  const where = {
    ...(options.q
      ? {
          OR: [
            { name: { contains: options.q } },
            { sku: { contains: options.q.toUpperCase() } },
            { slug: { contains: options.q.toLowerCase() } },
          ],
        }
      : {}),
    ...(options.categoryId ? { categoryId: options.categoryId } : {}),
    ...(options.status === "active" ? { isActive: true } : {}),
    ...(options.status === "draft" ? { isActive: false } : {}),
    ...(options.stock === "in" ? { stock: { gt: LOW_STOCK_THRESHOLD } } : {}),
    ...(options.stock === "low"
      ? { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } }
      : {}),
    ...(options.stock === "out" ? { stock: 0 } : {}),
  };

  // "Price" means the shelf price — the list price, with the sale price only
  // breaking ties. SQLite has no NULLS LAST, so letting the nullable sale
  // price lead the sort would gather every unsale-priced plant at one end.
  const orderBy: Record<AdminProductSort, object> = {
    newest: { createdAt: options.dir },
    name: { name: options.dir },
    price: [{ priceCents: options.dir }, { salePriceCents: options.dir }],
    stock: { stock: options.dir },
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: orderBy[options.sort],
      skip: (options.page - 1) * ADMIN_PRODUCTS_PER_PAGE,
      take: ADMIN_PRODUCTS_PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    rows: rows.map(toRow),
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PER_PAGE)),
  };
}

/** One product with everything the edit form needs, or null if it is gone. */
export async function getProductForEdit(
  id: string,
): Promise<(AdminProductRow & {
  description: string;
  careNotes: string;
  light: LightLevel;
  water: WaterLevel;
  petSafe: boolean;
  difficulty: Difficulty;
  heightCm: number | null;
  images: { id: string; url: string; alt: string; position: number }[];
}) | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    select: {
      ...productSelect,
      description: true,
      careNotes: true,
      light: true,
      water: true,
      petSafe: true,
      difficulty: true,
      heightCm: true,
      images: {
        select: { id: true, url: true, alt: true, position: true },
        orderBy: imageOrder,
      },
    },
  });

  if (!row) return null;

  // Same guard the storefront applies: an unexpected value in an enum-like
  // column means the row cannot be edited honestly.
  const light = lightLevelSchema.safeParse(row.light);
  const water = waterLevelSchema.safeParse(row.water);
  const difficulty = difficultySchema.safeParse(row.difficulty);

  if (!light.success || !water.success || !difficulty.success) return null;

  return {
    ...toRow(row),
    description: row.description,
    careNotes: row.careNotes,
    light: light.data,
    water: water.data,
    petSafe: row.petSafe,
    difficulty: difficulty.data,
    heightCm: row.heightCm,
    images: row.images,
  };
}

/** Whether a slug is taken by a product other than the one named. */
export async function slugIsTaken(
  slug: string,
  productId?: string,
): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) return false;
  return existing.id !== productId;
}

/** Whether any order line has ever pointed at this product. */
export async function productHasOrders(productId: string): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: { productId },
    take: 1,
  });

  return count > 0;
}

/** How many order lines point at this product, for the delete explanation. */
export async function productOrderCount(productId: string): Promise<number> {
  return prisma.orderItem.count({ where: { productId } });
}

/** The images of one product, in display order. */
export async function getProductImages(
  productId: string,
): Promise<{ id: string; url: string; alt: string; position: number }[]> {
  const rows = await prisma.productImage.findMany({
    where: { productId },
    select: { id: true, url: true, alt: true, position: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });

  return rows;
}

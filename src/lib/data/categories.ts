import "server-only";

import { prisma } from "@/lib/prisma";

/*
  Category queries.
*/

export type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  /** How many active products sit in the category, for the tile subtitle. */
  productCount: number;
  /** Cheapest active product in the category, so a tile can say "from $12". */
  startingPriceCents: number | null;
};

export type CategoryWithProducts = CategoryCard & {
  products: { id: string; name: string; slug: string }[];
};

/**
 * Every category that has something in it, in display order. A category with no
 * active products is left out rather than shown as an empty grid.
 */
export async function getCategories(): Promise<CategoryCard[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      sortOrder: true,
      products: {
        where: { isActive: true },
        select: { priceCents: true, salePriceCents: true },
      },
    },
  });

  return rows
    .map((row) => {
      const prices = row.products.map(
        (product) => product.salePriceCents ?? product.priceCents,
      );

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        image: row.image,
        sortOrder: row.sortOrder,
        productCount: row.products.length,
        startingPriceCents: prices.length > 0 ? Math.min(...prices) : null,
      };
    })
    .filter((row) => row.productCount > 0);
}

/**
 * One category with a short list of its products, for the category landing
 * page. Returns null when the slug does not match, so the page can 404 rather
 * than render an empty shell.
 */
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithProducts | null> {
  const row = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      sortOrder: true,
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          salePriceCents: true,
        },
      },
    },
  });

  if (!row) return null;

  const prices = row.products.map(
    (product) => product.salePriceCents ?? product.priceCents,
  );

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
    productCount: row.products.length,
    startingPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    products: row.products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
    })),
  };
}

/** Ids and names only, for a category dropdown in the admin. */
export async function getCategoryOptions(): Promise<
  { id: string; name: string }[]
> {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

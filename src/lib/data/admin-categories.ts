import "server-only";

import { prisma } from "@/lib/prisma";

/*
  Admin category queries.

  The storefront's category queries in /categories.ts return cards for tiles.
  These return table rows for the desk: the same categories, plus the product
  count that decides whether one can be deleted.
*/

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount: number;
};

/** Every category in display order, with how many products sit in each. */
export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  }));
}

/** One category for the edit dialog, or null if it is gone. */
export async function getCategoryForEdit(
  id: string,
): Promise<AdminCategoryRow | null> {
  const row = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  };
}

/** Whether a slug is taken by a category other than the one named. */
export async function categorySlugIsTaken(
  slug: string,
  categoryId?: string,
): Promise<boolean> {
  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) return false;
  return existing.id !== categoryId;
}

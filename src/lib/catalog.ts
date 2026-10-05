import { cache } from "react";

import { productStatusSchema } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type CatalogPlant = {
  id: string;
  name: string;
  latinName: string;
  note: string;
  priceLabel: string;
};

/**
 * Active products, newest first. `cache` dedupes this across a single render
 * pass so the home and shop views share one query.
 *
 * The stored status is a plain String (SQLite has no enums), so it is parsed
 * with the shared Zod schema and unknown values are dropped.
 */
export const getCatalog = cache(async (): Promise<CatalogPlant[]> => {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, latinName: true, note: true, priceCents: true, status: true },
  });

  return rows.flatMap((row) => {
    const parsed = productStatusSchema.safeParse(row.status);
    if (!parsed.success) return [];

    return [
      {
        id: row.id,
        name: row.name,
        latinName: row.latinName,
        note: row.note,
        priceLabel: formatPrice(row.priceCents),
      },
    ];
  });
});
import Image from "next/image";
import { LeafIcon } from "lucide-react";

import type { TopProduct } from "@/lib/data/admin";

/**
 * The five best sellers as horizontal bars.
 *
 * Bars scaled to the leader, not to a fantasy axis: the point is the ranking
 * and the gap between first and fifth, so the bar tells it directly and the
 * count beside each name says how much. Thumbnails ride along because a shelf
 * of plant faces reads faster than a list of nouns.
 */
export function TopProducts({ products }: { products: TopProduct[] }) {
  const lead = Math.max(...products.map((product) => product.units), 1);

  return (
    <ol className="flex flex-col gap-4">
      {products.map((product) => (
        <li key={product.name} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mint">
              {product.image ? (
                <Image
                  src={product.image}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <LeafIcon aria-hidden="true" className="size-4 text-forest" strokeWidth={1.75} />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate font-heading text-sm font-semibold tracking-[-0.01em] text-ink">
              {product.name}
            </span>
            <span className="shrink-0 text-sm text-ink/55 tabular-nums">
              {product.units} sold
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className="h-full rounded-full bg-forest"
              style={{ width: `${Math.round((product.units / lead) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

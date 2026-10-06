import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

/**
 * The featured strip.
 *
 * Two rows of four on desktop, two columns on a phone. The heading sits on a
 * hairline with the "see everything" link pushed to the far end, so this section
 * reads as the opening of a list rather than a self-contained box.
 */
export function FeaturedPlants({
  products,
  total,
}: {
  products: ProductCardData[];
  /** Every active product, so the link can promise the whole shop. */
  total: number;
}) {
  if (products.length === 0) return null;

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-ink/10 pb-6">
            <div>
              <p className="eyebrow">This week on the bench</p>
              <h2 className="mt-3 max-w-[18ch] text-h2 text-ink">
                Eight we would happily sell you.
              </h2>
            </div>

            <Link
              href="/shop"
              className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-forest underline-offset-[6px] hover:underline"
            >
              All {total} varieties
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4 transition-transform duration-300 ease-verdant group-hover/link:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>

        <Stagger
          className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
          delay={0.06}
        >
          {products.map((product, index) => (
            <StaggerItem key={product.id}>
              <ProductCard
                product={product}
                priority={index < 4}
                sizes="(min-width: 1024px) 21vw, (min-width: 640px) 30vw, 45vw"
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}